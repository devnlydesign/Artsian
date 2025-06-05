
"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, UserCircle, Mail, MapPin, Link as LinkIcon, Grid3x3, Clapperboard, Bookmark, Tag, CheckCircle, ExternalLink, Loader2, Users, Edit } from "lucide-react";
import NextImage from "next/image"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppState } from '@/context/AppStateContext';
import { getUserProfile, type UserProfileData } from '@/actions/userProfile';
import { getArtworksByUserId, type ArtworkData } from '@/actions/artworkActions'; // Import artwork actions
import { getPostsByUserId, type PostData } from '@/actions/postActions'; // Import post actions
import { ContentCard } from '@/components/content/ContentCard'; // Import ContentCard
import Link from 'next/link'; 

export default function ProfilePage() {
  const { currentUser, isAuthenticated, isLoadingAuth, refreshUserProfile } = useAppState(); // Added refreshUserProfile
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userArtworks, setUserArtworks] = useState<ArtworkData[]>([]);
  const [userPosts, setUserPosts] = useState<PostData[]>([]); // State for user posts
  
  const profileLinks = [
    // Example links, dynamically generate or fetch these in a real app
    // { title: "My Shop", url: "/shop/alexchroma_art" }, 
    // { title: "Behance", url: "https://behance.net/alexchroma" },
    // { title: "Instagram", url: "https://instagram.com/alexchroma_art" },
  ];

  const fetchProfileAndContent = useCallback(async () => {
    if (isAuthenticated && currentUser?.uid) {
      setIsLoading(true);
      const data = await getUserProfile(currentUser.uid);
      setProfileData(data);
      if (data) {
        const artworks = await getArtworksByUserId(currentUser.uid, currentUser.uid); // Pass self as requester for all own artworks
        setUserArtworks(artworks);
        const posts = await getPostsByUserId(currentUser.uid); // Get own posts
        setUserPosts(posts);
      }
      setIsLoading(false);
    } else if (!isLoadingAuth) {
      setIsLoading(false); 
    }
  }, [currentUser, isAuthenticated, isLoadingAuth]);


  useEffect(() => {
    if (!isLoadingAuth) {
        fetchProfileAndContent();
    }
  }, [fetchProfileAndContent, isLoadingAuth]);
  
  // Refresh profile if currentUserProfile changes in context (e.g., after settings update)
  useEffect(() => {
     if (currentUser && profileData && currentUser.uid === profileData.uid) {
        // Check if a more up-to-date version of profile is in context
        // This is a simplified check; more robust would involve comparing timestamps
        // For now, just re-fetch if user is the same
        fetchProfileAndContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUserProfile]); // Re-run if refreshUserProfile function reference changes (it shouldn't, but as a trigger)


  const handlePostDeleted = (deletedPostId: string) => {
    setUserPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };


  if (isLoadingAuth || isLoading) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden shadow-lg">
          <div className="relative h-40 md:h-64 bg-muted animate-pulse"></div>
          <CardContent className="pt-0 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 space-y-4 md:space-y-0 md:space-x-6 px-6 pb-6">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card shadow-lg bg-muted animate-pulse" />
              <div className="flex-1 text-center md:text-left pt-4">
                <div className="h-8 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /> <p>Loading Profile...</p></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !profileData) {
     return (
        <div className="text-center py-10">
            <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Please log in to view your profile.</p>
            <Button asChild variant="gradientPrimary"><Link href="/auth/login?redirect=/profile">Log In</Link></Button>
        </div>
    );
  }
  
  const name = profileData?.fullName || currentUser?.displayName || "Artist";
  const username = profileData?.username || currentUser?.email?.split('@')[0] || "artist_username";
  const bio = profileData?.bio || "Creative soul exploring the digital canvas.";
  const location = profileData?.location;
  const website = profileData?.website;
  const portfolioLink = profileData?.portfolioLink;
  const isPremium = profileData?.isPremium || false;
  const photoURL = profileData?.photoURL || "https://placehold.co/160x160.png"; 
  const bannerURL = profileData?.bannerURL || "https://placehold.co/1000x250.png"; 
  const followersCount = profileData?.followersCount || 0;
  const followingCount = profileData?.followingCount || 0;
  const postsCountDisplay = userPosts.length;
  const artworksCountDisplay = userArtworks.length;


  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-lg card-interactive-hover">
        <div className="relative h-40 md:h-64 bg-muted group">
          <NextImage 
            src={bannerURL} 
            alt="Profile banner" 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint={"abstract art studio wide"} 
            className="transition-transform group-hover:scale-105 duration-300"
            priority
            key={bannerURL} 
            />
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 space-y-4 md:space-y-0 md:space-x-6 px-6 pb-6">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card shadow-lg transition-transform hover:scale-105">
              <AvatarImage src={photoURL} alt={name} data-ai-hint={"artist self portrait painting"} key={photoURL}/>
              <AvatarFallback>{name.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left pt-4">
              <div className="flex items-center justify-center md:justify-start gap-1">
                <CardTitle className="text-3xl">{name}</CardTitle>
                {isPremium && <CheckCircle className="h-6 w-6 text-primary" title="Premium Member"/>}
              </div>
              <CardDescription className="text-lg text-muted-foreground">@{username}</CardDescription>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm">
                <span><span className="font-semibold">{postsCountDisplay}</span> posts</span>
                <span><span className="font-semibold">{artworksCountDisplay}</span> artworks</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">{followersCount.toLocaleString()}</span> followers</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">{followingCount.toLocaleString()}</span> following</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4 md:pt-0">
              <Button variant="outline" className="transition-transform hover:scale-105" asChild>
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Edit Profile</Link>
              </Button> 
            </div>
          </div>

          <div className="px-6 pb-6 space-y-3">
            <p className="text-sm">{bio}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{location}</span>}
              {website && 
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary hover:underline">
                  <LinkIcon className="h-3 w-3"/>{website.replace(/^https?:\/\//, '')}
                </a>
              }
              {portfolioLink && 
                <a href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary hover:underline">
                  <ExternalLink className="h-3 w-3"/>View Portfolio
                </a>
              }
            </div>
             {profileLinks && profileLinks.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">My Links</h4>
                <div className="flex flex-wrap gap-2">
                  {profileLinks.slice(0, isPremium ? profileLinks.length : 6).map((link, index) => (
                    <Button key={index} variant="outline" size="sm" asChild className="transition-transform hover:scale-105 hover:border-primary">
                      <a href={link.url.startsWith('http') || link.url.startsWith('mailto:') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer">
                        {link.title} <ExternalLink className="ml-1.5 h-3 w-3 opacity-70"/>
                      </a>
                    </Button>
                  ))}
                  {!isPremium && profileLinks.length > 6 && <p className="text-xs text-muted-foreground self-center">Upgrade to <Link href="/premium" className="underline">Premium</Link> for unlimited links.</p>}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:max-w-lg mx-auto">
          <TabsTrigger value="posts" className="transition-colors"><Edit className="h-5 w-5 mr-0 md:mr-2" /><span className="hidden md:inline">Posts</span></TabsTrigger>
          <TabsTrigger value="artworks" className="transition-colors"><Grid3x3 className="h-5 w-5 mr-0 md:mr-2" /><span className="hidden md:inline">Artworks</span></TabsTrigger>
          <TabsTrigger value="reels" className="transition-colors"><Clapperboard className="h-5 w-5 mr-0 md:mr-2"/><span className="hidden md:inline">Reels</span></TabsTrigger>
          <TabsTrigger value="saved" className="transition-colors"><Bookmark className="h-5 w-5 mr-0 md:mr-2"/><span className="hidden md:inline">Saved</span></TabsTrigger>
          <TabsTrigger value="tagged" className="transition-colors"><Tag className="h-5 w-5 mr-0 md:mr-2"/><span className="hidden md:inline">Tagged</span></TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <div className="space-y-4 mt-4">
            {userPosts.map(post => (
              <ContentCard key={post.id} content={post} currentUser={currentUser} onPostDeleted={handlePostDeleted}/>
            ))}
            {userPosts.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No posts yet.</p>}
          </div>
        </TabsContent>
        
        <TabsContent value="artworks">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 mt-4">
            {userArtworks.map(artwork => ( 
              <Link key={artwork.id} href={`/crystalline-blooms#item-${artwork.id}`} legacyBehavior>
                <a className="relative aspect-square bg-muted group overflow-hidden rounded-sm card-interactive-hover block">
                    <NextImage 
                        src={artwork.imageUrl || "https://placehold.co/300x300.png"} 
                        alt={artwork.title} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint={artwork.dataAiHint || "artwork image"}
                        className="transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    </div>
                </a>
              </Link>
            ))}
             {userArtworks.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No artworks yet.</p>}
          </div>
        </TabsContent>
        <TabsContent value="reels">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Clapperboard className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
              <p>Your Reels will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="saved">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
              <p>Your saved content will appear here. Only visible to you.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tagged">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
              <p>Content where you are tagged will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
