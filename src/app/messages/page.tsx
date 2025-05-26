
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagesSquare, Send, Paperclip, Search } from "lucide-react";
import { cn } from '@/lib/utils';
import type { SVGProps } from 'react'; // Image not used, removed Image import

interface Message {
  id: string;
  sender: 'user' | 'contact';
  text: string;
  timestamp: string;
  avatar?: string;
  dataAiHint?: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread?: number;
  dataAiHint: string;
}

const contactsData: Contact[] = [
  { id: "1", name: "Elena Vortex", avatar: "https://placehold.co/40x40.png", lastMessage: "Loved your latest bloom!", lastMessageTime: "10:32 AM", unread: 2, dataAiHint: "female artist portrait" },
  { id: "2", name: "Marcus Rune", avatar: "https://placehold.co/40x40.png", lastMessage: "Collaboration idea: what do you think?", lastMessageTime: "Yesterday", dataAiHint: "male designer face" },
  { id: "3", name: "Anya Spectra", avatar: "https://placehold.co/40x40.png", lastMessage: "The process symphony was inspiring!", lastMessageTime: "Mon", dataAiHint: "female musician profile" },
  { id: "4", name: "Kai Glitch", avatar: "https://placehold.co/40x40.png", lastMessage: "Check out this new generative tool.", lastMessageTime: "Last Week", dataAiHint: "male tech enthusiast" },
];

const initialMessages: Message[] = [
  { id: "m1", sender: 'contact', text: "Hey! Loved your latest 'Cosmic Dance' bloom. The colors are stunning!", timestamp: "10:30 AM", avatar: contactsData[0].avatar, dataAiHint: contactsData[0].dataAiHint },
  { id: "m2", sender: 'user', text: "Thanks so much, Elena! Glad you liked it.", timestamp: "10:31 AM" },
  { id: "m3", sender: 'contact', text: "Seriously, how do you get that shimmering effect?", timestamp: "10:32 AM", avatar: contactsData[0].avatar, dataAiHint: contactsData[0].dataAiHint },
];


export default function MessagesPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(contactsData[0]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;
    const msg: Message = {
      id: `m${messages.length + 1}`,
      sender: 'user',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  return (
    <div className="h-[calc(100vh-4rem-3.5rem)] flex flex-col"> {/* Adjust height based on header and padding */}
      <Card className="flex-1 flex overflow-hidden shadow-lg transition-shadow hover:shadow-xl">
        {/* Contacts List */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2"><MessagesSquare className="h-6 w-6 text-primary" /> Chats</CardTitle>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-8 h-9" />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            {contactsData.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  "flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b border-border transition-colors",
                  selectedContact?.id === contact.id && "bg-muted"
                )}
                onClick={() => setSelectedContact(contact)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint={contact.dataAiHint} />
                  <AvatarFallback>{contact.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs text-muted-foreground">{contact.lastMessageTime}</p>
                  {contact.unread && (
                    <Badge className="mt-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">{contact.unread}</Badge>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col bg-background">
          {selectedContact ? (
            <>
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} data-ai-hint={selectedContact.dataAiHint} />
                    <AvatarFallback>{selectedContact.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{selectedContact.name}</CardTitle>
                </div>
                {/* Add more actions like video call, info etc. here */}
              </CardHeader>
              <ScrollArea className="flex-1 p-4 space-y-4 bg-background">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2 max-w-[75%]",
                      msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {msg.sender === 'contact' && (
                       <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.avatar} alt="Contact Avatar" data-ai-hint={msg.dataAiHint} />
                        <AvatarFallback>{selectedContact.name.substring(0,1)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "p-3 rounded-lg shadow-sm",
                        msg.sender === 'user' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={cn("text-xs mt-1", msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left')}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
              <CardContent className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="transition-transform hover:scale-110">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button type="submit" size="icon" variant="gradientPrimary" className="transition-transform hover:scale-110">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessagesSquare className="h-24 w-24 mb-4" />
              <p className="text-lg">Select a contact to start chatting.</p>
              <p className="text-sm">This is your space for direct conversations.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

    