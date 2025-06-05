
'use server';

import { db } from '@/lib/firebase';
import {
  collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc,
  deleteDoc, getDoc, query, where, getDocs, runTransaction, increment, setDoc, orderBy, limit
} from 'firebase/firestore';
import type { CommentData, LikeData, BookmarkData, FollowData, ContentType } from '@/models/interactionTypes';
import { createPlatformNotification } from './notificationActions';
import { getUserProfile } from './userProfile';

// --- Comments ---
export async function addComment(
  userId: string,
  contentId: string,
  contentType: ContentType,
  commentText: string,
  parentId: string | null = null, // Added parentId for replies
  creatorName?: string | null, // Denormalized
  creatorAvatarUrl?: string | null // Denormalized
): Promise<{ success: boolean; commentId?: string; message?: string }> {
  if (!userId || !contentId || !contentType || !commentText) {
    return { success: false, message: "Missing required fields for comment." };
  }
  console.info(`[addComment] User ${userId} commenting on ${contentType} ${contentId}`);
  try {
    const commentRef = await addDoc(collection(db, 'comments'), {
      userId,
      contentId,
      contentType,
      commentText,
      parentId,
      creatorName: creatorName || "User",
      creatorAvatarUrl: creatorAvatarUrl || null,
      likesCount: 0,
      moderationStatus: 'pending', // All comments start as pending
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // commentsCount increment and notification creation will be handled by Cloud Function (onCreateComment).
    console.info(`[addComment] Comment ${commentRef.id} created. Moderation: pending.`);
    return { success: true, commentId: commentRef.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[addComment] Error:", msg, error);
    return { success: false, message: `Failed to add comment: ${msg}` };
  }
}

export async function getCommentsByContentId(contentId: string, contentType: ContentType, count: number = 5): Promise<CommentData[]> {
  if (!contentId || !contentType) return [];
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('contentId', '==', contentId),
      where('contentType', '==', contentType),
      where('moderationStatus', '==', 'approved'), // Only show approved comments
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommentData));
  } catch (error) {
    console.error(`[getCommentsByContentId] Error fetching comments for ${contentType} ${contentId}:`, error);
    return [];
  }
}


// --- Likes ---
export async function toggleLike(
  userId: string,
  contentId: string,
  contentType: ContentType
): Promise<{ success: boolean; liked: boolean; message?: string }> {
  if (!userId || !contentId || !contentType) {
    return { success: false, liked: false, message: "Missing required fields for like." };
  }
  console.info(`[toggleLike] User ${userId} toggling like for ${contentType} ${contentId}`);

  const likeId = `${userId}_${contentId}_${contentType}`;
  const likeRef = doc(db, 'likes', likeId);

  try {
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) { // Unlike
      await deleteDoc(likeRef);
      // likesCount decrement & notification deletion (if any) handled by Cloud Function (onDeleteLike).
      console.info(`[toggleLike] Unliked ${contentType} ${contentId} by ${userId}`);
      return { success: true, liked: false };
    } else { // Like
      await setDoc(likeRef, { userId, contentId, contentType, createdAt: serverTimestamp() });
      // likesCount increment & notification creation handled by Cloud Function (onCreateLike).
      console.info(`[toggleLike] Liked ${contentType} ${contentId} by ${userId}`);
      return { success: true, liked: true };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[toggleLike] Error:", msg, error);
    return { success: false, liked: false, message: `Failed to toggle like: ${msg}` };
  }
}

export async function getLikeStatus(userId: string, contentId: string, contentType: ContentType): Promise<boolean> {
  if (!userId || !contentId || !contentType) return false;
  const likeId = `${userId}_${contentId}_${contentType}`;
  const likeRef = doc(db, 'likes', likeId);
  try {
    const docSnap = await getDoc(likeRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`[getLikeStatus] Error checking like status for ${contentType} ${contentId}, user ${userId}:`, error);
    return false;
  }
}

// --- Bookmarks ---
export async function toggleBookmark(
  userId: string,
  contentId: string,
  contentType: ContentType,
  collectionName?: string // Optional for user-defined bookmark collections
): Promise<{ success: boolean; bookmarked: boolean; message?: string }> {
  if (!userId || !contentId || !contentType) {
    return { success: false, bookmarked: false, message: "Missing required fields for bookmark." };
  }
  console.info(`[toggleBookmark] User ${userId} toggling bookmark for ${contentType} ${contentId}`);

  const bookmarkId = `${userId}_${contentId}_${contentType}`;
  const bookmarkRef = doc(db, 'bookmarks', bookmarkId);

  try {
    const bookmarkSnap = await getDoc(bookmarkRef);
    if (bookmarkSnap.exists()) { // Unbookmark
      await deleteDoc(bookmarkRef);
      console.info(`[toggleBookmark] Unbookmarked ${contentType} ${contentId} by ${userId}`);
      return { success: true, bookmarked: false };
    } else { // Bookmark
      await setDoc(bookmarkRef, {
        userId,
        contentId,
        contentType,
        collectionName: collectionName || null, // Store null if no collection name
        createdAt: serverTimestamp()
      });
      console.info(`[toggleBookmark] Bookmarked ${contentType} ${contentId} by ${userId}`);
      return { success: true, bookmarked: true };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[toggleBookmark] Error:", msg, error);
    return { success: false, bookmarked: false, message: `Failed to toggle bookmark: ${msg}` };
  }
}

export async function getBookmarkStatus(userId: string, contentId: string, contentType: ContentType): Promise<boolean> {
  if (!userId || !contentId || !contentType) return false;
  const bookmarkId = `${userId}_${contentId}_${contentType}`;
  const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
  try {
    const docSnap = await getDoc(bookmarkRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`[getBookmarkStatus] Error checking bookmark status for ${contentType} ${contentId}, user ${userId}:`, error);
    return false;
  }
}


// --- Followers ---
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    console.warn('[followUser] Invalid user IDs or cannot follow self.');
    return { success: false, message: "Invalid user IDs or cannot follow self." };
  }
  console.info(`[followUser] Attempting: ${currentUserId} follows ${targetUserId}`);

  const followId = `${currentUserId}_${targetUserId}`; // Composite ID
  const followRef = doc(db, 'followers', followId);

  try {
    const followSnap = await getDoc(followRef);
    if (followSnap.exists()) {
      console.info(`[followUser] User ${currentUserId} already follows ${targetUserId}.`);
      return { success: false, message: "You are already following this user." };
    }

    await setDoc(followRef, {
      followerId: currentUserId,
      followingId: targetUserId, // Corrected from followedId to followingId for consistency
      createdAt: serverTimestamp(),
    });

    // Follower/Following counts and notification will be handled by Cloud Function (onFollowUser trigger).
    console.info(`[followUser] Success: ${currentUserId} now follows ${targetUserId}. Follow record created.`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[followUser] Error: ${currentUserId} follows ${targetUserId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to follow user: ${errorMessage}` };
  }
}

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
   if (!currentUserId || !targetUserId) {
    console.warn('[unfollowUser] Missing currentUserId or targetUserId.');
    return { success: false, message: "Invalid user IDs." };
  }
  console.info(`[unfollowUser] Attempting: ${currentUserId} unfollows ${targetUserId}`);

  const followId = `${currentUserId}_${targetUserId}`;
  const followRef = doc(db, 'followers', followId);

  try {
    const followSnap = await getDoc(followRef);
    if (!followSnap.exists()) {
      console.info(`[unfollowUser] User ${currentUserId} is not following ${targetUserId}.`);
      return { success: false, message: "You are not following this user." };
    }

    await deleteDoc(followRef);
    // Follower/Following counts decrement will be handled by Cloud Function (onUnfollowUser trigger).
    console.info(`[unfollowUser] Success: ${currentUserId} unfollowed ${targetUserId}. Follow record deleted.`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error(`[unfollowUser] Error for ${currentUserId} unfollowing ${targetUserId}: ${msg}`, error);
    return { success: false, message: `Failed to unfollow user: ${msg}` };
  }
}

export async function isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (!currentUserId || !targetUserId) return false;
    const followId = `${currentUserId}_${targetUserId}`;
    const followRef = doc(db, 'followers', followId);
    try {
        const docSnap = await getDoc(followRef);
        return docSnap.exists();
    } catch (error) {
        console.error(`[isFollowing] Error checking follow status for ${currentUserId} -> ${targetUserId}:`, error);
        return false;
    }
}
