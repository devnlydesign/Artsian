
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { PostData } from '@/models/contentTypes';
import type { UserProfileData } from './userProfile';

export async function createPost(
  userId: string,
  postDetails: Omit<PostData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'moderationStatus'>
): Promise<{ success: boolean; postId?: string; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }
  if (!postDetails.contentType || (!postDetails.caption && !postDetails.contentUrl)) {
    return { success: false, message: "Content type and caption or content URL are required." };
  }
  console.info(`[createPost] Attempting for userId: ${userId}`);

  try {
    const postsCollectionRef = collection(db, 'posts');
    const newPostRef = await addDoc(postsCollectionRef, {
      ...postDetails,
      userId,
      isPublic: postDetails.isPublic === undefined ? true : postDetails.isPublic,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      moderationStatus: 'pending', // Default to pending moderation
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createPost] Successfully created postId: ${newPostRef.id} for userId: ${userId}. Moderation: pending.`);
    // Cloud Function (onCreatePost) will handle user's postsCount update.
    // Cloud Function (onCreatePost) can trigger content moderation.
    return { success: true, postId: newPostRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    console.error("[createPost] Error:", errorMessage, error);
    return { success: false, message: `Failed to create post: ${errorMessage}` };
  }
}

export async function getPostById(postId: string): Promise<PostData | null> {
  if (!postId) {
    console.warn("[getPostById] Missing postId.");
    return null;
  }
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const data = postSnap.data() as PostData;
      // Basic visibility check, more robust checks in security rules
      if (data.moderationStatus === 'approved' || data.isPublic) { 
        return { id: postSnap.id, ...data };
      }
      console.warn(`[getPostById] Post ${postId} exists but not approved/public for general view.`);
      return null; 
    }
    console.warn(`[getPostById] Post ${postId} not found.`);
    return null;
  } catch (error) {
    console.error("[getPostById] Error:", error);
    return null;
  }
}

export async function getPostsByUserId(userId: string, count: number = 10): Promise<PostData[]> {
    if (!userId) {
        console.warn("[getPostsByUserId] Missing userId.");
        return [];
    }
    try {
        const postsRef = collection(db, 'posts');
        // For fetching own posts for profile management or personal feed, no public filter needed here.
        // Public filtering should happen when displaying other users' profiles or public feeds.
        const q = query(
            postsRef, 
            where("userId", "==", userId), 
            orderBy("createdAt", "desc"), 
            limit(count)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
    } catch (error) {
        console.error("[getPostsByUserId] Error:", error);
        return [];
    }
}

export async function getPublicPosts(count: number = 10): Promise<PostData[]> {
    // console.info("[getPublicPosts] Fetching public posts.");
    try {
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef,
            where("isPublic", "==", true),
            where("moderationStatus", "==", "approved"),
            orderBy("createdAt", "desc"),
            limit(count)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
    } catch (error) {
        console.error("[getPublicPosts] Error fetching public posts:", error);
        return [];
    }
}


// TODO: Add updatePost, deletePost actions.
// deletePost should trigger a Cloud Function (onDeletePost) to handle media deletion from Storage & cleanup interactions.
    
