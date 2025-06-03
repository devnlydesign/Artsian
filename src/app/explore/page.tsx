
"use client"; 

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Search, Users, UserPlus, UserCheck, Loader2 } from "lucide-react"; 
import NextImage from "next/image"; 
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppState } from '@/context/AppStateContext';
import { useToast } from "@/hooks/use-toast";
import { followUser, unfollowUser, isFollowing, getFollowerIds, getFollowingIds } from '@/actions/connectionActions'; // Assuming you create this
import { getUserProfile, type UserProfileData } from '@/actions/userProfile'; // To fetch user details if needed

const exploreItems = [
  { id: "e1", type: "image", src: "https://placehold.co/400x400.png", alt: "Abstract digital art", dataAiHint: "abstract digital art" },
  { id: "e2", type: "image", src: "https://placehold.co/400x600.png", alt: "Surreal landscape photography", dataAiHint: "surreal landscape" },
  { id: "e3", type: "video", src: "https://placehold.co/400x400.png", alt: "Generative art loop", dataAiHint: "generative art loop" },
  { id: "e4", type: "image", src: "https://placehold.co/600x400.png", alt: "Detailed character illustration", dataAiHint: "character illustration" },
];

// Mock User Data for Follow/Unfollow Demo
// In a real app, these UIDs would come from actual users.
const mockUsersForDemo: Array<Partial<UserProfileData> & { uid: string, isMock?: boolean }> = [
  { uid: "mockUser1", fullName: "Elena Vortex", username: "elena_vortex", photoURL: "https://placehold.co/60x60.png?text=EV", bio: "Painter of cosmic dreams.", isMock: true },
  { uid: "mockUser2", fullName: "Marcus Rune", username: "marcus_rune", photoURL: "https://placehold.co/60x60.png?text=MR", bio: "Sculptor of digital forms.", isMock: true },
  { uid: "mockUser3", fullName: "Anya Spectra", username: "anya_spectra", photoURL: "https://placehold.co/60x60.png?text=AS", bio: "Weaver of light and sound.", isMock: true },
];


export default function ExplorePage() { 
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const { toast } = useToast();
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [processingFollow, setProcessingFollow] = useState<string | null>(null);

  useEffect(() => {
    const checkInitialFollowStatus = async () => {
      if (isAuthenticated && currentUser) {
        const statusPromises = mockUsersForDemo.map(async (targetUser) => {
          if (targetUser.uid === currentUser.uid) return { [targetUser.uid]: false }; // Can't follow self
          const currentlyFollowing = await isFollowing(currentUser.uid, targetUser.uid);
          return { [targetUser.uid]: currentlyFollowing };
        });
        const statusesArray = await Promise.all(statusPromises);
        const newStatus = Object.assign({}, ...statusesArray);
        setFollowingStatus(newStatus);
      } else {
        // Reset status if user logs out
        const resetStatus: Record<string, boolean> = {};
        mockUsersForDemo.forEach(user => resetStatus[user.uid] = false);
        setFollowingStatus(resetStatus);
      }
    };

    if (!isLoadingAuth) {
      checkInitialFollowStatus();
    }
  }, [currentUser, isAuthenticated, isLoadingAuth]);

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser || !isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to follow users.", variant: "destructive" });
      return;
    }
    if (currentUser.uid === targetUserId) {
      toast({ title: "Action Not Allowed", description: "You cannot follow yourself.", variant: "destructive" });
      return;
    }

    setProcessingFollow(targetUserId);
    const currentlyFollowing = followingStatus[targetUserId];
    let result;

    if (currentlyFollowing) {
      result = await unfollowUser(currentUser.uid, targetUserId);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
        toast({ title: "Unfollowed", description: `You are no longer following this user.` });
      } else {
        toast({ title: "Error", description: result.message || "Failed to unfollow user.", variant: "destructive" });
      }
    } else {
      result = await followUser(currentUser.uid, targetUserId);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
        toast({ title: "Followed!", description: `You are now following this user.` });
      } else {
        toast({ title: "Error", description: result.message || "Failed to follow user.", variant: "destructive" });
      }
    }
    setProcessingFollow(null);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover sticky top-[calc(var(--header-height,4rem)+1rem)] z-10 bg-background/80 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl text-gradient-primary-accent">Explore Art & Creators</CardTitle>
          </div>
           <p className="text-xs text-muted-foreground ml-10">Created by Charis</p>
          <CardDescription className="ml-10 mt-1">Discover new artworks, talented artists, and vibrant communities on Charis Art Hub.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Search for art, artists, styles, or communities..." className="pl-10 h-11" />
            </div>
        </CardContent>
      </Card>

      {/* Mock Users Section for Follow/Unfollow Demo */}
      <Card className="card-interactive-hover">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-accent"/> Discover Creators</CardTitle>
            <CardDescription>Connect with other artists on Charis Art Hub. (Demo Follow System)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockUsersForDemo.map((user) => (
            <div key={user.uid} className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photoURL} alt={user.fullName || user.username} data-ai-hint="artist avatar" />
                  <AvatarFallback>{(user.fullName || user.username || "U").substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user.fullName || user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.bio || "An artist on Charis Art Hub."}</p>
                </div>
              </div>
              {isAuthenticated && currentUser?.uid !== user.uid && (
                <Button 
                  variant={followingStatus[user.uid] ? "outline" : "default"} 
                  size="sm"
                  onClick={() => handleFollowToggle(user.uid)}
                  disabled={processingFollow === user.uid || isLoadingAuth}
                  className="transition-all w-[110px]"
                >
                  {processingFollow === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    followingStatus[user.uid] ? <><UserCheck className="mr-1.5 h-4 w-4" /> Following</> : <><UserPlus className="mr-1.5 h-4 w-4" /> Follow</>
                  )}
                </Button>
              )}
              {(!isAuthenticated && !isLoadingAuth) && <Button variant="outline" size="sm" asChild><Link href="/auth/login">Follow</Link></Button>}
            </div>
          ))}
        </CardContent>
      </Card>


      <div className="masonry-grid">
        {exploreItems.map((item) => (
          <div key={item.id} className="masonry-item mb-4 card-interactive-hover rounded-lg overflow-hidden shadow-md">
            <NextImage 
              src={item.src} 
              alt={item.alt} 
              width={400} 
              height={item.id === 'e2' ? 600 : item.id === 'e4' ? 267 : item.id === 'e6' ? 500 : item.id === 'e7' ? 300 : item.id === 'e10' ? 300 : item.id === 'e11' ? 533 : 400} 
              className="object-cover w-full h-auto" 
              data-ai-hint={item.dataAiHint}
            />
          </div>
        ))}
      </div>
      <style jsx global>{`
        .masonry-grid {
          column-count: 2; 
          column-gap: 1rem;
        }
        .masonry-item {
          break-inside: avoid;
        }
        @media (min-width: 640px) { 
          .masonry-grid {
            column-count: 3;
          }
        }
        @media (min-width: 1024px) { 
          .masonry-grid {
            column-count: 4;
          }
        }
         @media (min-width: 1280px) { 
          .masonry-grid {
            column-count: 5;
          }
        }
      `}</style>

      <Card className="card-interactive-hover">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-accent"/> Explore Communities</CardTitle>
            <CardDescription>Find your tribe. Connect with artists sharing your interests.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["Digital Artists United", "Painters' Hub", "AI Art Explorers", "Sculpture Network"].map(name => (
                    <Button key={name} variant="secondary" className="h-auto py-3 transition-transform hover:scale-105" asChild>
                        <Link href="/communities">{name}</Link>
                    </Button>
                ))}
            </div>
        </CardContent>
         <CardFooter>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/communities">View All Communities <Compass className="ml-2 h-4 w-4"/></Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
