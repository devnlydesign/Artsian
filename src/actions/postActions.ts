
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { PostData } from '@/models/contentTypes';
import type { UserProfileData } from './userProfile';

// Server actions for managing Posts

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
    // TODO: Trigger Cloud Function to update user's postsCount
    // TODO: Trigger content moderation Cloud Function
    return { success: true, postId: newPostRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    console.error("[createPost] Error:", errorMessage, error);
    return { success: false, message: `Failed to create post: ${errorMessage}` };
  }
}

export async function getPostById(postId: string): Promise<PostData | null> {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      return { id: postSnap.id, ...postSnap.data() } as PostData;
    }
    return null;
  } catch (error) {
    console.error("[getPostById] Error:", error);
    return null;
  }
}

export async function getPostsByUserId(userId: string, count: number = 10): Promise<PostData[]> {
    if (!userId) return [];
    try {
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef, 
            where("userId", "==", userId), 
            where("moderationStatus", "==", "approved"), // Only show approved posts
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

// Add updatePost, deletePost, etc. as needed
    