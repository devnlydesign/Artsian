
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import type { PostData } from '@/models/contentTypes';
import type { UserProfileData } from './userProfile';

export async function createPost(
  userId: string,
  postDetails: Omit<PostData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'moderationStatus' | 'author'>,
  authorDetails: { name?: string; avatarUrl?: string | null; username?: string; dataAiHintAvatar?: string; }
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
      author: authorDetails,
      isPublic: postDetails.isPublic === undefined ? true : postDetails.isPublic,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      moderationStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createPost] Successfully created postId: ${newPostRef.id} for userId: ${userId}. Moderation: pending.`);
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

export async function getPostsByUsers(userIds: string[], postsLimit: number = 10): Promise<PostData[]> {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  // Firestore 'in' queries are limited to 30 items. If more, split into multiple queries.
  // For this example, we'll assume userIds.length <= 30.
  // For larger scale, a denormalized feed is better.
  if (userIds.length > 30) {
      console.warn("[getPostsByUsers] Querying for more than 30 users, this is inefficient. Consider feed denormalization.");
      userIds = userIds.slice(0, 30); // Truncate for this basic example
  }

  try {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('userId', 'in', userIds),
      where('isPublic', '==', true),
      where('moderationStatus', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
  } catch (error) {
    console.error("[getPostsByUsers] Error fetching posts:", error);
    return [];
  }
}

export async function deletePost(postId: string, userId: string): Promise<{ success: boolean; message?: string }> {
  if (!postId || !userId) {
    return { success: false, message: "Post ID and User ID are required for deletion." };
  }
  console.info(`[deletePost] User ${userId} attempting to delete post ${postId}`);
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, message: "Post not found." };
    }

    const postData = postSnap.data() as PostData;
    if (postData.userId !== userId) {
      return { success: false, message: "You are not authorized to delete this post." };
    }

    if (postData.contentUrl && postData.contentUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const fileRef = storageRef(storage, postData.contentUrl);
        await deleteObject(fileRef);
        console.info(`[deletePost] Successfully deleted media for post ${postId} from Storage.`);
      } catch (storageError: any) {
        if (storageError.code !== 'storage/object-not-found') {
          console.warn(`[deletePost] Error deleting media for post ${postId} from Storage: ${storageError.message}`);
        }
      }
    }

    await deleteDoc(postRef);
    console.info(`[deletePost] Successfully deleted post ${postId} from Firestore.`);
    // Cloud Function (onDeletePost) will handle decrementing user's postsCount and deleting related comments/likes.
    return { success: true, message: "Post deleted successfully." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    console.error(`[deletePost] Error deleting post ${postId}:`, errorMessage, error);
    return { success: false, message: `Failed to delete post: ${errorMessage}` };
  }
}
