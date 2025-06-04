
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck, Eye, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAppState } from '@/context/AppStateContext';
import { useToast } from '@/hooks/use-toast';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationData,
} from '@/actions/notificationActions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const getIconForType = (type: NotificationData["type"]) => {
  switch (type) {
    case "new_follower": return <UserPlus className="h-5 w-5 text-green-500" />;
    case "artwork_like": return <Heart className="h-5 w-5 text-red-500" />;
    case "artwork_comment": return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case "community_post": return <MessageCircle className="h-5 w-5 text-purple-500" />; // Example
    case "mention": return <UserPlus className="h-5 w-5 text-orange-500" />; // Example
    default: return <Bell className="h-5 w-5 text-primary" />;
  }
};

export default function NotificationsPage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchNotifications = async () => {
    if (currentUser?.uid) {
      setIsLoadingNotifications(true);
      try {
        const fetchedNotifications = await getUserNotifications(currentUser.uid);
        setNotifications(fetchedNotifications);
      } catch (error) {
        toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
      } finally {
        setIsLoadingNotifications(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      fetchNotifications();
    } else if (!isLoadingAuth && !isAuthenticated) {
      setIsLoadingNotifications(false);
      setNotifications([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isAuthenticated, isLoadingAuth]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUser?.uid) return;
    setIsProcessing(true);
    const result = await markNotificationAsRead(currentUser.uid, notificationId);
    if (result.success) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } else {
      toast({ title: "Error", description: result.message || "Failed to mark as read.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.uid) return;
    setIsProcessing(true);
    const result = await markAllNotificationsAsRead(currentUser.uid);
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({ title: "Success", description: `${result.count || 0} notifications marked as read.` });
    } else {
      toast({ title: "Error", description: result.message || "Failed to mark all as read.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
     return (
        <div className="space-y-8 max-w-2xl mx-auto text-center py-10">
             <Card className="shadow-lg card-interactive-hover">
                <CardHeader>
                <Bell className="mx-auto h-12 w-12 text-primary mb-2" />
                <CardTitle className="text-3xl">Notifications</CardTitle>
                <CardDescription>Log in to see your latest activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="gradientPrimary">
                        <Link href="/auth/login?redirect=/notifications">Log In</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Bell className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Notifications</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription>Stay updated with the latest activity related to your Charis Art Hub presence.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center p-4 border-t">
            <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={isLoadingNotifications || isProcessing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingNotifications && "animate-spin")} /> Refresh
            </Button>
            <Button variant="default" size="sm" onClick={handleMarkAllAsRead} disabled={isProcessing || notifications.every(n => n.isRead)}>
                {isProcessing && notifications.every(n => n.isRead) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                Mark all as read
            </Button>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-lg">
        <ScrollArea className="h-[calc(100vh-20rem)]"> {/* Adjust height as needed */}
          <CardContent className="pt-6 space-y-2">
            {isLoadingNotifications ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p className="mt-2">Loading notifications...</p></div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ease-in-out hover:bg-muted/50",
                    !notification.isRead ? 'bg-primary/5 border-primary/30' : 'bg-card'
                  )}
                >
                  {notification.actorAvatarUrl ? (
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarImage src={notification.actorAvatarUrl} alt={notification.actorName || 'User'} data-ai-hint={notification.actorName?.split(' ')[0].toLowerCase() || "user avatar"} />
                      <AvatarFallback>{(notification.actorName || "U").substring(0, 1)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center mt-1 rounded-full bg-muted">
                       {getIconForType(notification.type)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm" dangerouslySetInnerHTML={{__html: notification.message}}></p>
                    <p className="text-xs text-muted-foreground">
                        {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {!notification.isRead && (
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleMarkAsRead(notification.id)} disabled={isProcessing}>
                            <Eye className="h-4 w-4 mr-1" /> Mark Read
                        </Button>
                    )}
                     {notification.linkTo && (
                        <Button variant="outline" size="sm" asChild className="h-7 px-2">
                            <Link href={notification.linkTo}>View</Link>
                        </Button>
                    )}
                  </div>
                  {!notification.isRead && <div className="h-2.5 w-2.5 bg-primary rounded-full self-center animate-pulse ml-1"></div>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No notifications right now.
              </p>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
