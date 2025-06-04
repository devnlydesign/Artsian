
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
  getOrCreateChatChannel,
  sendMessage,
  getUserChatChannels,
  type ChatChannelData,
  type ChatMessageData,
} from '@/actions/messageActions';
import { getUserProfile, type UserProfileData } from '@/actions/userProfile'; // Import getUserProfile
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

  const [chatChannels, setChatChannels] = useState<ChatChannelData[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannelData | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
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

  // Fetch user's chat channels
  useEffect(() => {
    if (currentUser?.uid && isAuthenticated) {
      setIsLoadingChannels(true);
      getUserChatChannels(currentUser.uid)
        .then(setChatChannels)
        .catch(err => {
          console.error("Failed to fetch chat channels:", err);
          toast({ title: "Error", description: "Could not load your chats.", variant: "destructive" });
        })
        .finally(() => setIsLoadingChannels(false));
    } else if (!isLoadingAuth && !isAuthenticated) {
      setIsLoadingChannels(false);
      setChatChannels([]);
    }
  }, [currentUser, isAuthenticated, isLoadingAuth, toast]);

  // Listener for messages in the selected channel
  useEffect(() => {
    // Clean up previous listener
    if (messageListenerUnsubscribeRef.current) {
      messageListenerUnsubscribeRef.current();
      messageListenerUnsubscribeRef.current = null;
    }

    if (selectedChannel?.id && currentUser?.uid) {
      setIsLoadingMessages(true);
      const messagesRef = collection(db, 'chatChannels', selectedChannel.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: ChatMessageData[] = [];
        querySnapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, channelId: selectedChannel.id, ...doc.data() } as ChatMessageData);
        });
        setMessages(newMessages);
        setIsLoadingMessages(false);
        // Mark channel as read (basic version, could be more sophisticated)
        // if (newMessages.length > 0 && newMessages[newMessages.length - 1].senderId !== currentUser.uid) {
        //   markChannelAsRead(selectedChannel.id, currentUser.uid);
        // }
      }, (error) => {
        console.error("Error fetching messages in real-time:", error);
        toast({ title: "Error", description: "Could not load messages for this chat.", variant: "destructive" });
        setIsLoadingMessages(false);
      });
      messageListenerUnsubscribeRef.current = unsubscribe;
    } else {
      setMessages([]); // Clear messages if no channel selected
    }

    return () => {
      if (messageListenerUnsubscribeRef.current) {
        messageListenerUnsubscribeRef.current();
      }
    };
  }, [selectedChannel, currentUser, toast]);


  const handleSelectChannel = async (channel: ChatChannelData | { otherUserId: string; otherUserName?: string; otherUserAvatar?: string | null }) => {
    if (!currentUser) return;

    if ('members' in channel) { // Existing channel
        setSelectedChannel(channel as ChatChannelData);
    } else { // Initiating new chat with a mock/other user
        setIsLoadingMessages(true);
        try {
            const otherUserSnapshot = await getDoc(doc(db, "users", channel.otherUserId));
            let otherUserProfileData: UserProfileData | null = null;
            if(otherUserSnapshot.exists()){
                otherUserProfileData = otherUserSnapshot.data() as UserProfileData;
            }

            const { channelData } = await getOrCreateChatChannel(
                currentUser.uid, 
                channel.otherUserId,
                { fullName: currentUser.displayName, username: currentUser.email?.split('@')[0], photoURL: currentUser.photoURL },
                { fullName: otherUserProfileData?.fullName, username: otherUserProfileData?.username, photoURL: otherUserProfileData?.photoURL }
            );
            setSelectedChannel(channelData);
            
            // Add to local list if new and not present
            setChatChannels(prev => {
                if (!prev.find(c => c.id === channelData.id)) {
                    return [channelData, ...prev];
                }
                return prev;
            });

        } catch (error) {
            console.error("Error creating/getting chat channel:", error);
            toast({ title: "Chat Error", description: "Could not start or find chat.", variant: "destructive"});
        } finally {
            setIsLoadingMessages(false);
        }
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !selectedChannel || !currentUser) return;

    setIsSendingMessage(true);
    const tempMessageId = `temp_${Date.now()}`;
    const optimisticMessage: ChatMessageData = {
        id: tempMessageId,
        channelId: selectedChannel.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0],
        senderAvatar: currentUser.photoURL,
        text: newMessage,
        timestamp: Timestamp.now(), // Use Firestore Timestamp for optimistic update
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const currentMessageText = newMessage;
    setNewMessage("");
    scrollToBottom();

    try {
      const result = await sendMessage(
        selectedChannel.id, 
        currentUser.uid, 
        currentMessageText,
        currentUser.displayName || currentUser.email?.split('@')[0],
        currentUser.photoURL
      );
      if (!result.success) {
        toast({ title: "Send Error", description: result.message || "Failed to send message.", variant: "destructive" });
        setMessages(prev => prev.filter(m => m.id !== tempMessageId)); // Remove optimistic message on failure
      } else {
        // Optimistic message will be replaced by real-time listener update
      }
    } catch (error) {
      toast({ title: "Send Error", description: "An unexpected error occurred.", variant: "destructive" });
      setMessages(prev => prev.filter(m => m.id !== tempMessageId)); // Revert on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getOtherMemberInfo = (channel: ChatChannelData) => {
    if (!currentUser || !channel.members) return { name: "Chat User", avatarUrl: undefined };
    const otherUserId = channel.members.find(id => id !== currentUser.uid);
    if (!otherUserId || !channel.memberInfo || !channel.memberInfo[otherUserId]) {
      return { name: "Chat User", avatarUrl: "https://placehold.co/40x40.png" };
    }
    return {
        name: channel.memberInfo[otherUserId]?.name || "Chat User",
        avatarUrl: channel.memberInfo[otherUserId]?.avatarUrl || "https://placehold.co/40x40.png",
        dataAiHint: channel.memberInfo[otherUserId]?.name?.split(" ")[0].toLowerCase() || "user"
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
        {/* Sidebar for contacts/channels */}
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
            {isLoadingChannels ? (
              <div className="p-4 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2"/>Loading chats...</div>
            ) : (
              <>
                {chatChannels.map((channel) => {
                  const otherMember = getOtherMemberInfo(channel);
                  return (
                    <div
                        key={channel.id}
                        className={cn(
                        "flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b border-border transition-colors",
                        selectedChannel?.id === channel.id && "bg-muted"
                        )}
                        onClick={() => handleSelectChannel(channel)}
                    >
                        <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={otherMember.avatarUrl} alt={otherMember.name} data-ai-hint={otherMember.dataAiHint || "user avatar"}/>
                        <AvatarFallback>{otherMember.name?.substring(0, 1).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{otherMember.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {channel.lastMessageSenderId === currentUser?.uid ? "You: " : ""}
                            {channel.lastMessageText || "No messages yet."}
                        </p>
                        </div>
                        <div className="text-right ml-2">
                        <p className="text-xs text-muted-foreground">
                            {channel.lastMessageTimestamp ? formatDistanceToNow(channel.lastMessageTimestamp.toDate(), { addSuffix: true }) : ""}
                        </p>
                        {/* Basic unread badge - more complex logic needed for real unread counts */}
                        {channel.unreadCounts && currentUser && channel.unreadCounts[currentUser.uid] > 0 && (
                            <Badge className="mt-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                            {channel.unreadCounts[currentUser.uid]}
                            </Badge>
                        )}
                        </div>
                    </div>
                  );
                })}
                {/* Mock contacts for initiating new chats */}
                <CardDescription className="p-2 text-xs text-muted-foreground">Start a new chat:</CardDescription>
                {mockContactsForNewChat.filter(mock => !chatChannels.some(c => c.members.includes(mock.id))).map(mockContact => (
                     <div
                        key={mockContact.id}
                        className={cn(
                        "flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b border-border transition-colors opacity-70 hover:opacity-100"
                        )}
                        onClick={() => handleSelectChannel({ otherUserId: mockContact.id, otherUserName: mockContact.fullName, otherUserAvatar: mockContact.photoURL })}
                    >
                        <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={mockContact.photoURL} alt={mockContact.fullName} data-ai-hint={mockContact.username || "user avatar"} />
                            <AvatarFallback>{mockContact.fullName?.substring(0,1).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{mockContact.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">Start a new conversation</p>
                        </div>
                    </div>
                ))}
                 {chatChannels.length === 0 && !isLoadingChannels && (
                    <p className="p-4 text-center text-muted-foreground">No active chats. Start a new one!</p>
                )}
              </>
            )}
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <div className="w-2/3 flex flex-col bg-background">
          {selectedChannel && currentUser ? (
            <>
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={getOtherMemberInfo(selectedChannel).avatarUrl} alt={getOtherMemberInfo(selectedChannel).name} data-ai-hint={getOtherMemberInfo(selectedChannel).dataAiHint || "user avatar"} />
                        <AvatarFallback>{getOtherMemberInfo(selectedChannel).name?.substring(0, 1).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{getOtherMemberInfo(selectedChannel).name}</CardTitle>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4 space-y-4 bg-background">
                {isLoadingMessages && <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
                {!isLoadingMessages && messages.map((msg) => {
                  const isUserSender = msg.senderId === currentUser.uid;
                  const senderDisplayName = isUserSender ? (currentUser.displayName || currentUser.email?.split('@')[0]) : (msg.senderName || getOtherMemberInfo(selectedChannel).name);
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
                        <AvatarImage src={senderDisplayAvatar || undefined} alt={senderDisplayName} data-ai-hint="user avatar" />
                        <AvatarFallback>{senderDisplayName?.substring(0,1).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "p-3 rounded-lg shadow-sm",
                        isUserSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
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
