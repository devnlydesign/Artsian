
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagesSquare, Send, Paperclip, Search, Loader2, UserCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { useAppState } from '@/context/AppStateContext';
import { useToast } from '@/hooks/use-toast';
import {
  getOrCreateConversation, // Updated import
  sendMessageToConversation, // Updated import
  getUserConversations, // Updated import
  type ConversationData, // Updated import
  type MessageData, // Updated import
} from '@/actions/messageActions';
import { getUserProfile, type UserProfileData } from '@/actions/userProfile';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, Unsubscribe } from 'firebase/firestore';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';


// Mock contacts for initiating new chats - replace with actual user search/selection
const mockContactsForNewChat: Array<Partial<UserProfileData> & { id: string }> = [
  { id: "mockUserElena", fullName: "Elena Vortex", photoURL: "https://placehold.co/40x40.png?text=EV", username: "elena_vortex"},
  { id: "mockUserMarcus", fullName: "Marcus Rune", photoURL: "https://placehold.co/40x40.png?text=MR", username: "marcus_rune"},
  { id: "mockUserAnya", fullName: "Anya Spectra", photoURL: "https://placehold.co/40x40.png?text=AS", username: "anya_spectra"},
];


export default function MessagesPage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ConversationData[]>([]); // Renamed and typed
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | null>(null); // Renamed and typed
  const [messages, setMessages] = useState<MessageData[]>([]); // Typed
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(true); // Renamed
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageListenerUnsubscribeRef = useRef<Unsubscribe | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length) {
        scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Fetch user's conversations
  useEffect(() => {
    if (currentUser?.uid && isAuthenticated) {
      setIsLoadingConversations(true);
      getUserConversations(currentUser.uid) // Updated function call
        .then(setConversations)
        .catch(err => {
          console.error("Failed to fetch conversations:", err);
          toast({ title: "Error", description: "Could not load your chats.", variant: "destructive" });
        })
        .finally(() => setIsLoadingConversations(false));
    } else if (!isLoadingAuth && !isAuthenticated) {
      setIsLoadingConversations(false);
      setConversations([]);
    }
  }, [currentUser, isAuthenticated, isLoadingAuth, toast]);

  // Listener for messages in the selected conversation
  useEffect(() => {
    if (messageListenerUnsubscribeRef.current) {
      messageListenerUnsubscribeRef.current();
      messageListenerUnsubscribeRef.current = null;
    }

    if (selectedConversation?.id && currentUser?.uid) {
      setIsLoadingMessages(true);
      // Path updated to 'conversations/{id}/chat'
      const messagesRef = collection(db, 'conversations', selectedConversation.id, 'chat'); 
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: MessageData[] = [];
        querySnapshot.forEach((doc) => {
          // MessageData no longer needs channelId/conversationId within its structure for Firestore
          newMessages.push({ id: doc.id, ...doc.data() } as MessageData);
        });
        setMessages(newMessages);
        setIsLoadingMessages(false);
        // Basic unread marking (can be improved)
        // if (newMessages.length > 0 && newMessages[newMessages.length - 1].senderId !== currentUser.uid) {
        //   markConversationAsRead(selectedConversation.id, currentUser.uid); // Assuming you have this function
        // }
      }, (error) => {
        console.error("Error fetching messages in real-time:", error);
        toast({ title: "Error", description: "Could not load messages for this chat.", variant: "destructive" });
        setIsLoadingMessages(false);
      });
      messageListenerUnsubscribeRef.current = unsubscribe;
    } else {
      setMessages([]);
    }

    return () => {
      if (messageListenerUnsubscribeRef.current) {
        messageListenerUnsubscribeRef.current();
      }
    };
  }, [selectedConversation, currentUser, toast]);


  const handleSelectConversation = async (channelOrUser: ConversationData | { otherUserId: string; otherUserName?: string; otherUserAvatar?: string | null }) => {
    if (!currentUser) return;

    if ('participants' in channelOrUser) { // Existing conversation
        setSelectedConversation(channelOrUser as ConversationData);
    } else { // Initiating new chat with a mock/other user
        setIsLoadingMessages(true);
        try {
            const { conversationData } = await getOrCreateConversation( // Updated function call
                currentUser.uid, 
                [channelOrUser.otherUserId] // Pass otherUserId as an array
            );
            setSelectedConversation(conversationData);
            
            setConversations(prev => {
                if (!prev.find(c => c.id === conversationData.id)) {
                    return [conversationData, ...prev];
                }
                return prev;
            });

        } catch (error) {
            console.error("Error creating/getting conversation:", error);
            toast({ title: "Chat Error", description: "Could not start or find chat.", variant: "destructive"});
        } finally {
            setIsLoadingMessages(false);
        }
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !selectedConversation || !currentUser) return;

    setIsSendingMessage(true);
    const tempMessageId = `temp_${Date.now()}`;
    const optimisticMessage: MessageData = { // Type updated
        id: tempMessageId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0],
        senderAvatar: currentUser.photoURL,
        messageText: newMessage,
        timestamp: Timestamp.now(), 
        readBy: [currentUser.uid],
        isDeleted: false,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const currentMessageText = newMessage;
    setNewMessage("");
    scrollToBottom();

    try {
      const result = await sendMessageToConversation( // Updated function call
        selectedConversation.id, 
        currentUser.uid, 
        currentMessageText
        // Sender name/avatar are now fetched/handled by sendMessageToConversation or denormalized from UserProfile
      );
      if (!result.success) {
        toast({ title: "Send Error", description: result.message || "Failed to send message.", variant: "destructive" });
        setMessages(prev => prev.filter(m => m.id !== tempMessageId)); 
      }
    } catch (error) {
      toast({ title: "Send Error", description: "An unexpected error occurred.", variant: "destructive" });
      setMessages(prev => prev.filter(m => m.id !== tempMessageId)); 
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getOtherParticipantInfo = (conversation: ConversationData) => { // Renamed and parameter type updated
    if (!currentUser || !conversation.participants) return { name: "Chat User", avatarUrl: undefined };
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    
    if (!otherUserId || !conversation.participantInfo || !conversation.participantInfo[otherUserId]) {
      // Attempt to find the mock user info if it's a new chat not yet fully populated
      const mockUser = mockContactsForNewChat.find(u => u.id === otherUserId);
      if (mockUser) {
          return {
              name: mockUser.fullName || "Chat User",
              avatarUrl: mockUser.photoURL || "https://placehold.co/40x40.png",
              dataAiHint: mockUser.username || "user"
          }
      }
      return { name: "Chat User", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "user" };
    }
    return {
        name: conversation.participantInfo[otherUserId]?.name || "Chat User",
        avatarUrl: conversation.participantInfo[otherUserId]?.avatarUrl || "https://placehold.co/40x40.png",
        dataAiHint: conversation.participantInfo[otherUserId]?.name?.split(" ")[0].toLowerCase() || "user"
    };
  };
  

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
     return (
        <div className="flex flex-col justify-center items-center h-full text-center p-4">
            <MessagesSquare className="h-20 w-20 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Welcome to Charis Chat</h2>
            <p className="text-muted-foreground mb-6">Log in to connect with other artists and collaborators.</p>
            <Button asChild variant="gradientPrimary" size="lg">
                <Link href="/auth/login?redirect=/messages">Log In to Chat</Link>
            </Button>
        </div>
    );
  }


  return (
    <div className="h-[calc(100vh-var(--header-height,4rem)-3.5rem)] flex flex-col">
      <Card className="flex-1 flex overflow-hidden shadow-lg transition-shadow hover:shadow-xl card-interactive-hover">
        <div className="w-1/3 border-r border-border flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2"><MessagesSquare className="h-6 w-6 text-primary" /> Chat</CardTitle>
            </div>
             <p className="text-xs text-muted-foreground mt-0.5">Direct Energy Channels</p>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-8 h-9" />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="p-4 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2"/>Loading chats...</div>
            ) : (
              <>
                {conversations.map((conv) => { // Use updated conversations state
                  const otherMember = getOtherParticipantInfo(conv);
                  return (
                    <div
                        key={conv.id}
                        className={cn(
                        "flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b border-border transition-colors",
                        selectedConversation?.id === conv.id && "bg-muted"
                        )}
                        onClick={() => handleSelectConversation(conv)}
                    >
                        <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={otherMember.avatarUrl} alt={otherMember.name} data-ai-hint={otherMember.dataAiHint || "user avatar"}/>
                        <AvatarFallback>{otherMember.name?.substring(0, 1).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{otherMember.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessageSenderId === currentUser?.uid ? "You: " : ""}
                            {conv.lastMessageText || "No messages yet."}
                        </p>
                        </div>
                        <div className="text-right ml-2">
                        <p className="text-xs text-muted-foreground">
                            {conv.lastMessageTimestamp ? formatDistanceToNow(conv.lastMessageTimestamp.toDate(), { addSuffix: true }) : ""}
                        </p>
                        {conv.unreadCounts && currentUser && (conv.unreadCounts[currentUser.uid] || 0) > 0 && (
                            <Badge className="mt-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                            {conv.unreadCounts[currentUser.uid]}
                            </Badge>
                        )}
                        </div>
                    </div>
                  );
                })}
                <CardDescription className="p-2 text-xs text-muted-foreground">Start a new chat:</CardDescription>
                {mockContactsForNewChat.filter(mock => !conversations.some(c => c.participants.includes(mock.id))).map(mockContact => (
                     <div
                        key={mockContact.id}
                        className={cn(
                        "flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b border-border transition-colors opacity-70 hover:opacity-100"
                        )}
                        onClick={() => handleSelectConversation({ otherUserId: mockContact.id, otherUserName: mockContact.fullName, otherUserAvatar: mockContact.photoURL })}
                    >
                        <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={mockContact.photoURL} alt={mockContact.fullName || "User"} data-ai-hint={mockContact.username || "user avatar"} />
                            <AvatarFallback>{mockContact.fullName?.substring(0,1).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{mockContact.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">Start a new conversation</p>
                        </div>
                    </div>
                ))}
                 {conversations.length === 0 && !isLoadingConversations && (
                    <p className="p-4 text-center text-muted-foreground">No active chats. Start a new one!</p>
                )}
              </>
            )}
          </ScrollArea>
        </div>

        <div className="w-2/3 flex flex-col bg-background">
          {selectedConversation && currentUser ? (
            <>
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={getOtherParticipantInfo(selectedConversation).avatarUrl} alt={getOtherParticipantInfo(selectedConversation).name} data-ai-hint={getOtherParticipantInfo(selectedConversation).dataAiHint || "user avatar"} />
                        <AvatarFallback>{getOtherParticipantInfo(selectedConversation).name?.substring(0, 1).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{getOtherParticipantInfo(selectedConversation).name}</CardTitle>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4 space-y-4 bg-background">
                {isLoadingMessages && <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
                {!isLoadingMessages && messages.map((msg) => {
                  const isUserSender = msg.senderId === currentUser.uid;
                  const senderDisplayName = isUserSender ? (currentUser.displayName || currentUser.email?.split('@')[0]) : (msg.senderName || getOtherParticipantInfo(selectedConversation).name);
                  const senderDisplayAvatar = isUserSender ? currentUser.photoURL : msg.senderAvatar;

                  return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2 max-w-[75%]",
                      isUserSender ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {!isUserSender && (
                       <Avatar className="h-8 w-8">
                        <AvatarImage src={senderDisplayAvatar || undefined} alt={senderDisplayName || "User"} data-ai-hint="user avatar" />
                        <AvatarFallback>{senderDisplayName?.substring(0,1).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "p-3 rounded-lg shadow-sm",
                        isUserSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                      )}
                    >
                      <p className="text-sm">{msg.messageText}</p>
                      <p className={cn("text-xs mt-1", isUserSender ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left')}>
                        {msg.timestamp instanceof Timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true}) : "Sending..."}
                      </p>
                    </div>
                  </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </ScrollArea>
              <CardContent className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="transition-transform hover:scale-110" type="button" disabled>
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    autoComplete="off"
                    disabled={isSendingMessage}
                  />
                  <Button type="submit" size="icon" variant="gradientPrimary" className="transition-transform hover:scale-110" disabled={isSendingMessage}>
                    {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              <MessagesSquare className="h-24 w-24 mb-4" />
              <p className="text-lg">Select a chat or start a new conversation.</p>
              <p className="text-sm">Your Direct Energy Channels await.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

    