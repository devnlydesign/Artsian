
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, UserPlus, Users, Palette, Sparkles, Loader2, Image as ImageIcon, UploadCloud, PlusSquare } from "lucide-react"; 
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ContentCard } from '@/components/content/ContentCard';
import { useAppState } from '@/context/AppStateContext';
import type { PostData } from '@/models/contentTypes';
import { getPublicPosts } from '@/actions/postActions'; 
import { db, storage } from '@/lib/firebase'; 
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const placeholderPosts: PostData[] = [
  {
    id: "ph1",
    userId: "userCosmic",
    author: { name: "Cosmic Creator", username: "cosmicart", avatarUrl: "https://placehold.co/40x40.png?text=CC", dataAiHintAvatar: "female artist portrait" },
    contentUrl: "https://placehold.co/600x750.png",
    contentType: 'post',
    caption: "Exploring new dimensions in my latest piece 'Nebula Dreams'. What do you see? ✨ #digitalart #space #abstract",
    likesCount: 1203,
    commentsCount: 88,
    createdAt: Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000), 
    dataAiHintImage: "nebula dreams abstract",
    isPublic: true,
  },
  {
    id: "ph2",
    userId: "userStudio",
    author: { name: "Studio Vibes", username: "studiolife", avatarUrl: "https://placehold.co/40x40.png?text=SV", dataAiHintAvatar: "male designer profile" },
    contentUrl: "https://placehold.co/600x600.png",
    contentType: 'post',
    caption: "Weekend experiments with generative patterns. Sometimes the process is the art. #genart #creativecoding #wip",
    likesCount: 756,
    commentsCount: 42,
    createdAt: Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000), 
    dataAiHintImage: "generative patterns code",
    isPublic: true,
  },
];

const stories = [
    { id: "s1", name: "Your Story", avatar: "https://placehold.co/64x64.png", dataAiHint: "user plus icon", isOwn: true },
    { id: "s2", name: "Elena V.", avatar: "https://placehold.co/64x64.png", dataAiHint: "female artist avatar" },
    { id: "s3", name: "Marcus R.", avatar: "https://placehold.co/64x64.png", dataAiHint: "male designer avatar" },
];

const suggestions = [
    { id: "u1", name: "Future Artist", avatar: "https://placehold.co/40x40.png", dataAiHint: "futuristic person avatar", bio: "Exploring digital frontiers." },
    { id: "u2", name: "PixelPerfect", avatar: "https://placehold.co/40x40.png", dataAiHint: "pixel character avatar", bio: "Lover of all things 8-bit." },
];

const StoriesBar = () => (
  <Card className="overflow-hidden transition-shadow hover:shadow-md mb-6 md:mb-8">
    <CardContent className="p-0">
      <div className="flex space-x-3 p-4 overflow-x-auto">
        {stories.map(story => (
          <div key={story.id} className="flex flex-col items-center w-20 shrink-0 cursor-pointer group">
            <div className={`relative rounded-full p-0.5 border-2 group-hover:scale-105 transition-transform ${story.isOwn ? 'border-transparent' : 'border-accent'}`}>
              <Avatar className="h-16 w-16">
                <NextImage src={story.avatar} alt={story.name} width={64} height={64} className="rounded-full" data-ai-hint={story.dataAiHint} />
              </Avatar>
              {story.isOwn && <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-card"><UserPlus className="h-3 w-3"/></div>}
            </div>
            <p className="text-xs mt-1 truncate w-full text-center group-hover:text-primary transition-colors">{story.name}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);


export default function HomePage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [feedPosts, setFeedPosts] = useState<PostData[]>(placeholderPosts);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoadingFeed(true);
    const postsRef = collection(db, 'posts');
    const q = query(
        postsRef,
        where("isPublic", "==", true),
        where("moderationStatus", "==", "approved"),
        orderBy("createdAt", "desc"),
        limit(20)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const publicPosts: PostData[] = [];
        querySnapshot.forEach((doc) => {
            publicPosts.push({ id: doc.id, ...doc.data() } as PostData);
        });
        setFeedPosts(publicPosts.length > 0 ? publicPosts : []);
        setIsLoadingFeed(false);
    }, (error) => {
        console.error("Error fetching public posts in real-time: ", error);
        toast({title: "Feed Error", description: "Could not load live feed updates.", variant: "destructive"});
        setFeedPosts(placeholderPosts); 
        setIsLoadingFeed(false);
    });

    return () => unsubscribe(); 
  }, [toast]);

  const handlePostDeleted = (deletedPostId: string) => {
    setFeedPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };


  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 py-0 md:py-6"> 
      <div className="lg:col-span-2 space-y-6 md:space-y-8">
        <StoriesBar />

        {isAuthenticated && (
          <Card className="mb-6 md:mb-8 card-interactive-hover">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "User"} />
                    <AvatarFallback>{currentUser?.displayName?.substring(0,1) || "U"}</AvatarFallback>
                </Avatar>
                What's on your mind, {currentUser?.displayName || 'artist'}?
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/posts/new">
                        <PlusSquare className="mr-2 h-4 w-4"/> Create a New Post
                    </Link>
                </Button>
            </CardContent>
          </Card>
        )}


        {isLoadingAuth || isLoadingFeed ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg">Loading feed...</p>
          </div>
        ) : feedPosts.length === 0 ? (
             <Card className="text-center py-10 card-interactive-hover">
                <CardContent>
                    <Palette className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
                    <p className="text-muted-foreground">No public posts found yet. Be the first to create one!</p>
                     {!isAuthenticated && (
                        <Button asChild variant="link" className="mt-2"><Link href="/auth/signup">Sign up to post</Link></Button>
                    )}
                </CardContent>
            </Card>
        ) : (
          feedPosts.map((post) => (
            <ContentCard key={post.id} content={post} currentUser={currentUser} onPostDeleted={handlePostDeleted}/>
          ))
        )}
        {!isAuthenticated && !isLoadingFeed && feedPosts.length > 0 && (
            <Card className="mt-6 text-center p-4 bg-primary/10 border-primary/30">
                <CardDescription>
                    You are viewing public posts. <Link href="/auth/login" className="text-primary font-semibold hover:underline">Log in</Link> or <Link href="/auth/signup" className="text-primary font-semibold hover:underline">sign up</Link> to create posts and see a personalized feed!
                </CardDescription>
            </Card>
        )}
      </div>

      <aside className="lg:col-span-1 space-y-6 sticky top-20 h-fit hidden lg:block">
        <Card className="card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Suggested for You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map(sugg => (
              <div key={sugg.id} className="flex items-center justify-between hover:bg-muted/50 p-1.5 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <NextImage src={sugg.avatar} alt={sugg.name} width={40} height={40} className="rounded-full" data-ai-hint={sugg.dataAiHint}/>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm hover:underline cursor-pointer">{sugg.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{sugg.bio}</p>
                  </div>
                </div>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto" asChild>
                    <Link href={isAuthenticated ? `/profile/${sugg.id}` : "/auth/login"}>Follow</Link>
                </Button>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full hover:border-primary">See All Suggestions</Button>
          </CardFooter>
        </Card>
        <Card className="card-interactive-hover">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                 <Button variant="ghost" className="w-full justify-start hover:text-accent" asChild><Link href="/algorithmic-muse">AI Idea Sparker</Link></Button>
                 <Button variant="ghost" className="w-full justify-start hover:text-accent" asChild><Link href="/process-symphony">Creative Soundtracks</Link></Button>
                 <Button variant="ghost" className="w-full justify-start hover:text-accent" asChild><Link href="/crystalline-blooms/new">Create New Artwork</Link></Button>
            </CardContent>
        </Card>
        <div className="text-xs text-muted-foreground space-x-2">
            <Link href="#" className="hover:underline">About</Link>
            <Link href="#" className="hover:underline">Help</Link>
            <Link href="#" className="hover:underline">Privacy</Link>
            <Link href="#" className="hover:underline">Terms</Link>
        </div>
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Charisarthub</p>
      </aside>
    </div>
  );
}
