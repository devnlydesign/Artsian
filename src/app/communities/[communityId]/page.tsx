
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageCircle, Image as ImageIcon, Users, ArrowLeft, Trash2, Send } from "lucide-react";
import NextImage from "next/image";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useAppState } from '@/context/AppStateContext';
import { 
  getCommunityById, 
  getCommunityPosts, 
  createCommunityPost, 
  deleteCommunityPost,
  isUserMemberOfCommunity,
  joinCommunity,
  leaveCommunity,
  type CommunityData, 
  type CommunityPostData 
} from '@/actions/communityActions';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const createPostSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty.").max(2000, "Post content is too long."),
  imageUrl: z.string().url("Please enter a valid image URL.").optional().or(z.literal('')),
  dataAiHintImageUrl: z.string().max(50, "AI hint too long.").optional().or(z.literal('')),
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.communityId as string;
  
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isProcessingMembership, setIsProcessingMembership] = useState(false);

  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const { toast } = useToast();

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "", imageUrl: "", dataAiHintImageUrl: "" },
  });

  const fetchCommunityData = useCallback(async () => {
    if (!communityId) return;
    setIsLoading(true);
    try {
      const communityData = await getCommunityById(communityId);
      if (!communityData) {
        toast({ title: "Error", description: "Community not found.", variant: "destructive" });
        router.push('/communities');
        return;
      }
      setCommunity(communityData);
      
      const communityPosts = await getCommunityPosts(communityId);
      setPosts(communityPosts);

      if (currentUser?.uid) {
        const memberStatus = await isUserMemberOfCommunity(currentUser.uid, communityId);
        setIsMember(memberStatus);
      } else {
        setIsMember(false);
      }

    } catch (error) {
      console.error("Error fetching community details:", error);
      toast({ title: "Error", description: "Could not load community details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [communityId, toast, router, currentUser]);

  useEffect(() => {
    if (!isLoadingAuth) {
      fetchCommunityData();
    }
  }, [fetchCommunityData, isLoadingAuth]);

  const handleCreatePost: SubmitHandler<CreatePostFormValues> = async (data) => {
    if (!currentUser || !communityId || !isMember) {
      toast({ title: "Cannot Post", description: "You must be a member to post.", variant: "destructive" });
      return;
    }
    setIsPosting(true);
    try {
      const result = await createCommunityPost(
        communityId,
        currentUser.uid,
        currentUser.displayName || "Anonymous Artist",
        currentUser.photoURL,
        data.content,
        data.imageUrl,
        data.dataAiHintImageUrl || (data.imageUrl ? "community post image" : undefined)
      );
      if (result.success) {
        toast({ title: "Post Created!", description: "Your post is now live in the community." });
        form.reset();
        fetchCommunityData(); // Refresh posts
      } else {
        toast({ title: "Post Failed", description: result.message || "Could not create post.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({ title: "Error", description: "An unexpected error occurred while posting.", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || !communityId) return;
    const originalPosts = [...posts];
    setPosts(posts.filter(p => p.id !== postId)); // Optimistic update

    try {
      const result = await deleteCommunityPost(communityId, postId, currentUser.uid);
      if (result.success) {
        toast({ title: "Post Deleted", description: "Your post has been removed." });
      } else {
        setPosts(originalPosts); // Revert optimistic update
        toast({ title: "Deletion Failed", description: result.message || "Could not delete post.", variant: "destructive" });
      }
    } catch (error) {
      setPosts(originalPosts); // Revert
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleJoinLeaveCommunity = async () => {
    if (!currentUser || !communityId || !community) return;
    setIsProcessingMembership(true);
    try {
      let result;
      if (isMember) {
        result = await leaveCommunity(currentUser.uid, communityId);
        toast({ title: "Left Community", description: `You have left '${community.name}'.` });
      } else {
        result = await joinCommunity(currentUser.uid, communityId);
        toast({ title: "Joined Community!", description: `Welcome to '${community.name}'!` });
      }
      if (result.success) {
        fetchCommunityData(); // Refresh membership status and member count
      } else {
        toast({ title: "Action Failed", description: result.message || "Could not update membership.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error joining/leaving community:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsProcessingMembership(false);
    }
  };

  if (isLoading || isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Community not found or could not be loaded.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/communities">Back to Communities</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.push('/communities')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Communities
      </Button>

      <Card className="overflow-hidden shadow-lg card-interactive-hover">
        {community.imageUrl && (
          <div className="relative h-48 md:h-64 bg-muted group">
            <NextImage 
              src={community.imageUrl} 
              alt={community.name} 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint={community.dataAiHint || "community banner image"}
              className="transition-transform group-hover:scale-105 duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}
        <CardHeader className={community.imageUrl ? "pt-4" : ""}>
          <CardTitle className="text-3xl text-gradient-primary-accent">{community.name}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Created by {community.creatorName}</p>
          <CardDescription className="mt-2">{community.description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground flex items-center">
                <Users className="mr-1.5 h-4 w-4 text-primary" /> {community.memberCount} members
            </div>
            {isAuthenticated && (
                <Button 
                    variant={isMember ? "outline" : "default"} 
                    onClick={handleJoinLeaveCommunity}
                    disabled={isProcessingMembership}
                    className={cn(isMember && "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive")}
                >
                    {isProcessingMembership && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessingMembership ? (isMember ? "Leaving..." : "Joining...") : (isMember ? "Leave Community" : "Join Community")}
                </Button>
            )}
            {!isAuthenticated && <Badge>Log in to join</Badge>}
        </CardFooter>
      </Card>

      {isAuthenticated && isMember && (
        <Card className="card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary"/> Create a New Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleCreatePost)} className="space-y-4">
              <div>
                <Textarea
                  placeholder={`What's on your mind, ${currentUser?.displayName || 'artist'}? Share with the ${community.name} community!`}
                  {...form.register("content")}
                  rows={4}
                  className="mb-1"
                  disabled={isPosting}
                />
                {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
              </div>
              <div>
                 <label htmlFor="imageUrl" className="text-sm font-medium">Image URL (Optional)</label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/your-image.png"
                  {...form.register("imageUrl")}
                  className="mb-1 mt-1"
                  disabled={isPosting}
                />
                {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
              </div>
               <div>
                 <label htmlFor="dataAiHintImageUrl" className="text-sm font-medium">Image AI Hint (Optional)</label>
                <Input
                  id="dataAiHintImageUrl"
                  type="text"
                  placeholder="e.g., abstract art"
                  {...form.register("dataAiHintImageUrl")}
                   className="mb-1 mt-1"
                  disabled={isPosting}
                />
                 {form.formState.errors.dataAiHintImageUrl && <p className="text-sm text-destructive">{form.formState.errors.dataAiHintImageUrl.message}</p>}
              </div>
              <Button type="submit" variant="gradientPrimary" disabled={isPosting} className="w-full">
                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isPosting ? "Posting..." : "Share Post"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      {!isAuthenticated && (
        <Card className="text-center p-6 card-interactive-hover">
          <p className="text-muted-foreground">Log in to join the community and create posts.</p>
          <Button asChild className="mt-2" variant="gradientPrimary"><Link href="/auth/login">Log In</Link></Button>
        </Card>
      )}
       {!isMember && isAuthenticated && (
        <Card className="text-center p-6 card-interactive-hover">
          <p className="text-muted-foreground">Join this community to create posts and engage with members.</p>
        </Card>
      )}


      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Community Feed</h2>
        {posts.length > 0 ? (
          posts.map(post => (
            <Card key={post.id} className="card-interactive-hover">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={post.creatorAvatarUrl || undefined} alt={post.creatorName} data-ai-hint="user avatar" />
                  <AvatarFallback>{post.creatorName.substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold hover:underline cursor-pointer">{post.creatorName}</p>
                    {currentUser?.uid === post.creatorId && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap mb-3">{post.content}</p>
                {post.imageUrl && (
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden my-2">
                    <NextImage 
                        src={post.imageUrl} 
                        alt="Post image" 
                        layout="fill" 
                        objectFit="contain" 
                        data-ai-hint={post.dataAiHintImageUrl || "community post image"}
                    />
                  </div>
                )}
              </CardContent>
              {/* Future: Add CardFooter for likes, comments, share */}
            </Card>
          ))
        ) : (
          <Card className="text-center p-8">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
            <p className="text-muted-foreground">No posts in this community yet.</p>
            {isMember && isAuthenticated && <p className="text-sm text-muted-foreground">Be the first to share something!</p>}
          </Card>
        )}
      </div>
    </div>
  );
}

    