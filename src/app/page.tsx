
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";
import { Users, Palette, Sparkles, Loader2, PlusSquare } from "lucide-react"; 
import Link from 'next/link';
import { ContentCard } from '@/components/content/ContentCard';
import { useAppState } from '@/context/AppStateContext';
import type { PostData } from '@/models/contentTypes';
import { getPublicPosts, getPostsByUsers } from '@/actions/postActions'; 
import { getFollowingIds } from '@/actions/connectionActions';
import { db } from '@/lib/firebase'; 
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, type DocumentSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const POSTS_PER_PAGE = 5;

export default function HomePage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [feedPosts, setFeedPosts] = useState<PostData[]>([]);
  const [lastFetchedDoc, setLastFetchedDoc] = useState<DocumentSnapshot | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [latestPostTimestamp, setLatestPostTimestamp] = useState<Timestamp | null>(null);


  const { toast } = useToast();
  const newPostsListenerUnsubscribeRef = useRef<() => void>(() => {});

  const fetchFeedPosts = useCallback(async (isInitialLoad = false, lastDoc: DocumentSnapshot | null = null) => {
    if (isInitialLoad) {
      setIsLoadingInitial(true);
      setFeedPosts([]); // Clear existing posts on initial load or user change
      setLastFetchedDoc(null);
      setHasMorePosts(true);
      setLatestPostTimestamp(null);
    } else {
      setIsLoadingMore(true);
    }

    let result: { posts: PostData[], lastDoc: DocumentSnapshot | null } = { posts: [], lastDoc: null };
    let followedIds: string[] = [];

    try {
      if (isAuthenticated && currentUser?.uid) {
        followedIds = await getFollowingIds(currentUser.uid);
        if (followedIds.length > 0) {
          const userAndFollowedIds = [...new Set([currentUser.uid, ...followedIds])];
          result = await getPostsByUsers(userAndFollowedIds, POSTS_PER_PAGE, lastDoc);
        } else {
          // If not following anyone, show own posts and public posts (or just public)
          result = await getPublicPosts(POSTS_PER_PAGE, lastDoc);
        }
      } else {
        result = await getPublicPosts(POSTS_PER_PAGE, lastDoc);
      }

      if (result.posts.length > 0) {
        setFeedPosts(prevPosts => isInitialLoad ? result.posts : [...prevPosts, ...result.posts]);
        if (isInitialLoad && result.posts[0]?.createdAt) {
          setLatestPostTimestamp(result.posts[0].createdAt);
        }
      }
      setLastFetchedDoc(result.lastDoc);
      setHasMorePosts(result.posts.length === POSTS_PER_PAGE);

    } catch (error) {
      console.error("Error fetching feed posts:", error);
      toast({ title: "Feed Error", description: "Could not load posts.", variant: "destructive" });
    } finally {
      if (isInitialLoad) setIsLoadingInitial(false);
      else setIsLoadingMore(false);
    }
  }, [currentUser, isAuthenticated, toast]);

  // Initial fetch
  useEffect(() => {
    if (!isLoadingAuth) {
      fetchFeedPosts(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAuth, currentUser]); // Re-fetch if auth state or user changes

  // Real-time listener for NEW posts
  useEffect(() => {
    if (newPostsListenerUnsubscribeRef.current) {
      newPostsListenerUnsubscribeRef.current();
    }
    if (!isLoadingInitial && latestPostTimestamp) {
      let q;
      if (isAuthenticated && currentUser?.uid) {
        // Complex to listen to all followed users + public efficiently here without duplicating feed logic.
        // For simplicity, new post indicator might just be for general public new posts or a simpler query.
        // This example listens for public posts newer than what's loaded.
        q = query(
          collection(db, 'posts'),
          where('isPublic', '==', true),
          where("moderationStatus", "==", "approved"),
          where('createdAt', '>', latestPostTimestamp),
          orderBy('createdAt', 'desc')
        );
      } else {
         q = query(
          collection(db, 'posts'),
          where('isPublic', '==', true),
          where("moderationStatus", "==", "approved"),
          where('createdAt', '>', latestPostTimestamp),
          orderBy('createdAt', 'desc')
        );
      }

      newPostsListenerUnsubscribeRef.current = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty && snapshot.docs.length > 0) {
          const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
          // Prepend new posts, ensuring no duplicates if fetchFeedPosts ran concurrently
          setFeedPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(p => p.id));
            const uniqueNewPosts = newDocs.filter(p => !existingIds.has(p.id));
            if (uniqueNewPosts.length > 0) {
              setNewPostsAvailable(true); // Indicator that new posts are available
              return [...uniqueNewPosts, ...prevPosts];
            }
            return prevPosts;
          });
          if (newDocs[0]?.createdAt) {
            setLatestPostTimestamp(newDocs[0].createdAt); // Update latest timestamp
          }
        }
      }, (error) => {
        console.error("Error listening for new posts:", error);
      });
    }
    return () => {
      if (newPostsListenerUnsubscribeRef.current) {
        newPostsListenerUnsubscribeRef.current();
      }
    };
  }, [isLoadingInitial, latestPostTimestamp, isAuthenticated, currentUser?.uid]);

  const handlePostDeleted = (deletedPostId: string) => {
    setFeedPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };

  const suggestions = [
    { id: "u1", name: "Future Artist", avatar: "https://placehold.co/40x40.png", dataAiHint: "futuristic person avatar", bio: "Exploring digital frontiers." },
    { id: "u2", name: "PixelPerfect", avatar: "https://placehold.co/40x40.png", dataAiHint: "pixel character avatar", bio: "Lover of all things 8-bit." },
  ];

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 py-0 md:py-6"> 
      <div className="lg:col-span-2 space-y-6 md:space-y-8">
        {isAuthenticated && (
          <Card className="mb-6 md:mb-8 card-interactive-hover">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "User"} data-ai-hint="user avatar" />
                    <AvatarFallback>{currentUser?.displayName?.substring(0,1) || "U"}</AvatarFallback>
                </Avatar>
                Welcome back, {currentUser?.displayName || 'artist'}!
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

        {newPostsAvailable && (
          <Button variant="outline" className="w-full mb-4" onClick={() => { setNewPostsAvailable(false); /* Optionally refresh if needed, but posts are prepended */ }}>
            New posts available! Click to dismiss or scroll up.
          </Button>
        )}

        {isLoadingInitial ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg">Loading your universe...</p>
          </div>
        ) : feedPosts.length === 0 ? (
             <Card className="text-center py-10 card-interactive-hover">
                <CardContent>
                    <Palette className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
                    <p className="text-muted-foreground">No posts found yet. {isAuthenticated ? "Create one or follow others to populate your feed!" : "Explore or sign up to see more!"}</p>
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
        
        {hasMorePosts && !isLoadingInitial && (
          <Button 
            variant="outline" 
            className="w-full mt-6" 
            onClick={() => fetchFeedPosts(false, lastFetchedDoc)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoadingMore ? "Loading More..." : "Load More Posts"}
          </Button>
        )}

        {!isAuthenticated && !isLoadingInitial && feedPosts.length > 0 && (
            <Card className="mt-6 text-center p-4 bg-primary/10 border-primary/30">
                <CardDescription>
                    You are viewing public posts. <Link href="/auth/login" className="text-primary font-semibold hover:underline">Log in</Link> or <Link href="/auth/signup" className="text-primary font-semibold hover:underline">sign up</Link> for a personalized feed and to interact!
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
