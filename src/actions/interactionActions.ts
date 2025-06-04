
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, runTransaction, increment } from 'firebase/firestore';
import type { CommentData, LikeData, BookmarkData, FollowData, ContentType } from '@/models/interactionTypes';
// import { createNotification } from './notificationActions'; // Assuming notificationActions.ts exists

// --- Comments ---
export async function addComment(
  userId: string,
  contentId: string,
  contentType: ContentType,
  commentText: string
): Promise<{ success: boolean; commentId?: string; message?: string }> {
  if (!userId || !contentId || !contentType || !commentText) {
    return { success: false, message: "Missing required fields for comment." };
  }
  try {
    const commentRef = await addDoc(collection(db, 'comments'), {
      userId,
      contentId,
      contentType,
      commentText,
      likesCount: 0,
      moderationStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Increment commentsCount on the parent content document
    const contentRef = doc(db, `${contentType}s`, contentId); // Assumes plural collection names
    await updateDoc(contentRef, { commentsCount: increment(1) });
    
    // TODO: Create notification for content owner and mentions
    // const contentDoc = await getDoc(contentRef);
    // if (contentDoc.exists() && contentDoc.data()?.userId !== userId) {
    //   await createNotification({ recipientId: contentDoc.data()?.userId, type: 'comment', ... });
    // }

    return { success: true, commentId: commentRef.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[addComment] Error:", msg, error);
    return { success: false, message: `Failed to add comment: ${msg}` };
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
  
  const likeId = `${userId}_${contentId}_${contentType}`; // Composite ID for likes
  const likeRef = doc(db, 'likes', likeId);
  const contentRef = doc(db, `${contentType}s`, contentId); // Assumes plural collection names

  try {
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) { // Unlike
      await deleteDoc(likeRef);
      await updateDoc(contentRef, { likesCount: increment(-1) });
      // TODO: Delete like notification if one was created
      return { success: true, liked: false };
    } else { // Like
      await setDoc(likeRef, { userId, contentId, contentType, createdAt: serverTimestamp() });
      await updateDoc(contentRef, { likesCount: increment(1) });
      // TODO: Create notification for content owner
      // const contentDoc = await getDoc(contentRef);
      // if (contentDoc.exists() && contentDoc.data()?.userId !== userId) {
      //    await createNotification({ recipientId: contentDoc.data()?.userId, type: 'like', ... });
      // }
      return { success: true, liked: true };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[toggleLike] Error:", msg, error);
    return { success: false, liked: false, message: `Failed to toggle like: ${msg}` };
  }
}

// --- Bookmarks ---
export async function toggleBookmark(
  userId: string,
  contentId: string,
  contentType: ContentType
): Promise<{ success: boolean; bookmarked: boolean; message?: string }> {
  if (!userId || !contentId || !contentType) {
    return { success: false, bookmarked: false, message: "Missing required fields for bookmark." };
  }

  const bookmarkId = `${userId}_${contentId}_${contentType}`; // Composite ID for bookmarks
  const bookmarkRef = doc(db, 'bookmarks', bookmarkId);

  try {
    const bookmarkSnap = await getDoc(bookmarkRef);
    if (bookmarkSnap.exists()) { // Unbookmark
      await deleteDoc(bookmarkRef);
      return { success: true, bookmarked: false };
    } else { // Bookmark
      await setDoc(bookmarkRef, { userId, contentId, contentType, createdAt: serverTimestamp() });
      return { success: true, bookmarked: true };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[toggleBookmark] Error:", msg, error);
    return { success: false, bookmarked: false, message: `Failed to toggle bookmark: ${msg}` };
  }
}

// --- Followers --- (Replaces connectionActions.ts)
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { success: false, message: "Invalid user IDs or cannot follow self." };
  }

  const followId = `${currentUserId}_${targetUserId}`;
  const followRef = doc(db, 'followers', followId);
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  try {
    const followSnap = await getDoc(followRef);
    if (followSnap.exists()) {
      return { success: false, message: "Already following this user." };
    }

    await runTransaction(db, async (transaction) => {
      transaction.set(followRef, {
        followerId: currentUserId,
        followingId: targetUserId,
        createdAt: serverTimestamp(),
      });
      transaction.update(currentUserRef, { followingCount: increment(1) });
      transaction.update(targetUserRef, { followersCount: increment(1) });
    });
    
    // TODO: Create notification for targetUserId
    // await createNotification({ recipientId: targetUserId, type: 'follow', senderId: currentUserId, ... });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[followUser] Error:", msg, error);
    return { success: false, message: `Failed to follow user: ${msg}` };
  }
}

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
   if (!currentUserId || !targetUserId) {
    return { success: false, message: "Invalid user IDs." };
  }
  const followId = `${currentUserId}_${targetUserId}`;
  const followRef = doc(db, 'followers', followId);
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  try {
    const followSnap = await getDoc(followRef);
    if (!followSnap.exists()) {
      return { success: false, message: "Not following this user." };
    }
    
    await runTransaction(db, async (transaction) => {
      transaction.delete(followRef);
      transaction.update(currentUserRef, { followingCount: increment(-1) });
      transaction.update(targetUserRef, { followersCount: increment(-1) });
    });
    
    // TODO: Delete follow notification if one exists
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error.";
    console.error("[unfollowUser] Error:", msg, error);
    return { success: false, message: `Failed to unfollow user: ${msg}` };
  }
}

export async function isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (!currentUserId || !targetUserId) return false;
    const followId = `${currentUserId}_${targetUserId}`;
    const followRef = doc(db, 'followers', followId);
    const docSnap = await getDoc(followRef);
    return docSnap.exists();
}

// ... other interaction actions
    