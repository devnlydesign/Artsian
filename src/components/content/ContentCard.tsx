
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, Link as LinkIconLucide, BarChart2, Loader2, UserCircle } from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { type User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { deletePost } from '@/actions/postActions'; // Import deletePost

import {
  toggleLike,
  addComment,
  getCommentsByContentId,
  toggleBookmark,
  getLikeStatus,
  getBookmarkStatus,
  type CommentData
} from '@/actions/interactionActions';

// Assuming PostData will be the primary type, but can be extended for reels etc.
interface ContentData {
  id: string;
  userId: string; // Author's UID
  author?: { // Denormalized for easier display
    name?: string;
    avatarUrl?: string | null;
    username?: string;
    dataAiHintAvatar?: string;
  };
  contentType?: 'text' | 'image' | 'video' | 'audio' | 'livestream_upcoming' | 'livestream_live' | 'livestream_ended' | 'post';
  contentUrl?: string | null; // For image, video, audio
  caption?: string | null;
  createdAt: Timestamp;
  likesCount: number;
  commentsCount: number;
  isPublic?: boolean;
  videoUrl?: string | null; 
  dataAiHintImage?: string;
  dataAiHintVideo?: string;
  // Add sharesCount if it's part of your PostData or other content types
  sharesCount?: number; 
}


interface ContentCardProps {
  content: ContentData;
  currentUser: FirebaseUser | null;
  onPostDeleted?: (postId: string) => void; // Callback for when a post is deleted
}

export function ContentCard({ content, currentUser, onPostDeleted }: ContentCardProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(content.likesCount || 0);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<CommentData[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);


  const contentTypeForInteractions = content.contentType || 'post';

  const fetchInteractionStatus = useCallback(async () => {
    if (currentUser && content.id && contentTypeForInteractions) {
      const liked = await getLikeStatus(currentUser.uid, content.id, contentTypeForInteractions);
      setIsLiked(liked);
      const bookmarked = await getBookmarkStatus(currentUser.uid, content.id, contentTypeForInteractions);
      setIsBookmarked(bookmarked);
    }
  }, [currentUser, content.id, contentTypeForInteractions]);

  const fetchComments = useCallback(async () => {
    if (content.id && contentTypeForInteractions) {
      setIsLoadingComments(true);
      try {
        const fetchedComments = await getCommentsByContentId(content.id, contentTypeForInteractions);
        setComments(fetchedComments);
      } catch (error) {
        toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
      } finally {
        setIsLoadingComments(false);
      }
    }
  }, [content.id, contentTypeForInteractions, toast]);

  useEffect(() => {
    fetchInteractionStatus();
    fetchComments();
  }, [fetchInteractionStatus, fetchComments]);
  
  useEffect(() => {
    setCurrentLikes(content.likesCount || 0);
  }, [content.likesCount]);


  const handleLikeToggle = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to like content.", variant: "default" });
      return;
    }
    if (!content.id || !contentTypeForInteractions) return;

    const originalLikedState = isLiked;
    const originalLikesCount = currentLikes;

    setIsLiked(!originalLikedState);
    setCurrentLikes(originalLikedState ? originalLikesCount - 1 : originalLikesCount + 1);

    const result = await toggleLike(currentUser.uid, content.id, contentTypeForInteractions);
    if (!result.success) {
      setIsLiked(originalLikedState); 
      setCurrentLikes(originalLikesCount);
      toast({ title: "Error", description: result.message || "Failed to update like.", variant: "destructive" });
    }
  };

  const handleBookmarkToggle = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to save content.", variant: "default" });
      return;
    }
     if (!content.id || !contentTypeForInteractions) return;

    const originalBookmarkedState = isBookmarked;
    setIsBookmarked(!originalBookmarkedState);

    const result = await toggleBookmark(currentUser.uid, content.id, contentTypeForInteractions);
    if (!result.success) {
      setIsBookmarked(originalBookmarkedState);
      toast({ title: "Error", description: result.message || "Failed to update bookmark.", variant: "destructive" });
    } else {
      toast({ title: isBookmarked ? "Removed from Saved" : "Saved!", description: isBookmarked ? "Content removed from your saved items." : "Content added to your saved items." });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to comment.", variant: "default" });
      return;
    }
    if (newComment.trim() === "" || !content.id || !contentTypeForInteractions) return;

    setIsSubmittingComment(true);
    const tempCommentId = `temp_${Date.now()}`;
    const optimisticComment: CommentData = {
      id: tempCommentId,
      contentId: content.id,
      contentType: contentTypeForInteractions,
      userId: currentUser.uid,
      creatorName: currentUser.displayName || "User",
      creatorAvatarUrl: currentUser.photoURL,
      commentText: newComment,
      createdAt: Timestamp.now(),
      likesCount: 0,
    };
    setOptimisticComments(prev => [optimisticComment, ...prev]);
    const commentToSubmit = newComment;
    setNewComment("");


    const result = await addComment(
      currentUser.uid,
      content.id,
      contentTypeForInteractions,
      commentToSubmit,
      null,
      currentUser.displayName || "User",
      currentUser.photoURL
    );

    if (result.success) {
      setOptimisticComments(prev => prev.filter(c => c.id !== tempCommentId));
      await fetchComments(); 
    } else {
      setOptimisticComments(prev => prev.filter(c => c.id !== tempCommentId));
      toast({ title: "Error", description: result.message || "Failed to add comment.", variant: "destructive" });
    }
    setIsSubmittingComment(false);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/${contentTypeForInteractions}/${content.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast({ title: "Link Copied!", description: "Content link copied to clipboard." }))
      .catch(() => toast({ title: "Error", description: "Could not copy link.", variant: "destructive" }));
  };

  const handleDeletePost = async () => {
    if (!currentUser || currentUser.uid !== content.userId || !content.id) {
      toast({ title: "Error", description: "You are not authorized to delete this post or post ID is missing.", variant: "destructive" });
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (!confirmDelete) return;

    setIsDeleting(true);
    const result = await deletePost(content.id, currentUser.uid);
    if (result.success) {
      toast({ title: "Post Deleted", description: result.message });
      if (onPostDeleted) {
        onPostDeleted(content.id); // Callback to parent to update feed
      }
    } else {
      toast({ title: "Error", description: result.message || "Failed to delete post.", variant: "destructive" });
    }
    setIsDeleting(false);
  };
  
  const displayComments = [...optimisticComments, ...comments].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  const authorName = content.author?.name || "Charis Artist";
  const authorUsername = content.author?.username || content.userId.substring(0,8);
  const authorAvatar = content.author?.avatarUrl;
  const authorAvatarHint = content.author?.dataAiHintAvatar || "artist avatar";
  const mediaUrl = content.videoUrl || content.contentUrl;
  const mediaType = content.videoUrl ? 'video' : (content.contentUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image' : 'other');
  const dataAiHint = content.dataAiHintVideo || content.dataAiHintImage || "content media";

  return (
    <Card className="overflow-hidden shadow-lg w-full card-interactive-hover">
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <Link href={`/profile/${content.userId}`} className="flex items-center gap-3 group">
          <Avatar className="transition-transform group-hover:scale-110">
            <AvatarImage src={authorAvatar || undefined} alt={authorName} data-ai-hint={authorAvatarHint} />
            <AvatarFallback>{authorName?.substring(0, 1).toUpperCase() || "A"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm group-hover:underline">{authorName}</p>
            <p className="text-xs text-muted-foreground">@{authorUsername}</p>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>Copy Link</DropdownMenuItem>
            {currentUser?.uid === content.userId && (
              <>
                <DropdownMenuItem disabled>Edit Post (Not Implemented)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeletePost} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete Post"}
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
              </>
            )}
             <DropdownMenuItem asChild>
                <Link href={`/insights/${contentTypeForInteractions}/${content.id}`}>
                <BarChart2 className="mr-2 h-4 w-4" /> View Insights
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem disabled>Report Content (Not Implemented)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {mediaUrl && (
        <CardContent className="p-0">
          <div className="relative w-full aspect-[4/5] bg-muted">
            {mediaType === 'image' ? (
              <NextImage src={mediaUrl} alt={content.caption || "Content image"} layout="fill" objectFit="cover" data-ai-hint={dataAiHint} />
            ) : mediaType === 'video' ? (
              <video src={mediaUrl} controls className="w-full h-full object-cover" data-ai-hint={dataAiHint} >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="file icon">
                Unsupported media type or no preview available.
              </div>
            )}
          </div>
        </CardContent>
      )}

      <CardFooter className="flex flex-col items-start p-3 space-y-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={handleLikeToggle} className={cn("active:scale-90", isLiked && "text-red-500 hover:text-red-600")}>
              <Heart className={cn("h-6 w-6", isLiked && "fill-current")}/>
            </Button>
            <Button variant="ghost" size="icon" className="hover:text-primary active:scale-90" onClick={() => document.getElementById(`comment-input-${content.id}`)?.focus()}>
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} className="hover:text-primary active:scale-90">
              <LinkIconLucide className="h-6 w-6" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleBookmarkToggle} className={cn("active:scale-90", isBookmarked && "text-primary hover:text-primary/90")}>
             <Bookmark className={cn("h-6 w-6", isBookmarked && "fill-current")} />
          </Button>
        </div>

        <p className="font-semibold text-sm">{currentLikes.toLocaleString()} likes</p>
        
        {content.caption && (
          <p className="text-sm">
            <Link href={`/profile/${content.userId}`} className="font-semibold hover:underline">{authorUsername}</Link> {content.caption}
          </p>
        )}
        
        {comments.length + optimisticComments.length > 0 && (
          <div className="text-sm text-muted-foreground hover:underline cursor-pointer">
            View all {(comments.length + optimisticComments.length).toLocaleString()} comments
          </div>
        )}
        
        <p className="text-xs text-muted-foreground uppercase">
          {content.createdAt ? formatDistanceToNow(content.createdAt.toDate(), { addSuffix: true }) : "Just now"}
        </p>

        <div className="w-full pt-2 border-t border-border">
          {isLoadingComments ? (
            <div className="text-xs text-muted-foreground">Loading comments...</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto text-xs pr-2">
              {displayComments.slice(0, 2).map(comment => (
                <div key={comment.id} className="flex gap-1.5">
                    <Link href={`/profile/${comment.userId}`} className="font-semibold hover:underline shrink-0">
                        {comment.creatorName || comment.userId.substring(0,6)}:
                    </Link>
                    <p className="truncate">{comment.commentText}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-2">
            <Avatar className="h-7 w-7">
                <AvatarImage src={currentUser?.photoURL || undefined} data-ai-hint="current user avatar"/>
                <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
            </Avatar>
            <Input
              id={`comment-input-${content.id}`}
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 h-8 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
              disabled={!currentUser || isSubmittingComment}
            />
            <Button type="submit" variant="ghost" size="sm" className="text-primary hover:text-primary/80" disabled={!currentUser || isSubmittingComment || newComment.trim() === ""}>
              {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : "Post"}
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
}

    