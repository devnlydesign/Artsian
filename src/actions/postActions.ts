
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, orderBy, limit, startAfter, type DocumentSnapshot, writeBatch } from 'firebase/firestore';
import { ref as storageRefSdkFirebase, deleteObject as deleteStorageObjectFirebase } from 'firebase/storage';
import type { PostData } from '@/models/contentTypes';
import type { UserProfileData } from './userProfile';

export async function createPost(
  userId: string,
  postDetails: Omit<PostData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'moderationStatus'>,
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
      author: authorDetails, // Save denormalized author details
      isPublic: postDetails.isPublic === undefined ? true : postDetails.isPublic,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      moderationStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createPost] Successfully created postId: ${newPostRef.id} for userId: ${userId}. Moderation status: pending.`);
    // Cloud Function (onCreatePost) should update user's postsCount and notify followers.
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
      // Consider if moderationStatus check is needed here for direct fetch or if it's owner-only context
      return { id: postSnap.id, ...data };
    }
    console.warn(`[getPostById] Post ${postId} not found.`);
    return null;
  } catch (error) {
    console.error("[getPostById] Error:", error);
    return null;
  }
}

export async function getPostsByUserId(
  userId: string, 
  postsLimit: number = 10,
  lastVisibleDoc: DocumentSnapshot | null = null
  ): Promise<{ posts: PostData[], lastDoc: DocumentSnapshot | null }> {
    if (!userId) {
        console.warn("[getPostsByUserId] Missing userId.");
        return { posts: [], lastDoc: null};
    }
    try {
        const postsRef = collection(db, 'posts');
        let qConstraints = [
            where("userId", "==", userId), 
            orderBy("createdAt", "desc"), 
            limit(postsLimit)
        ];

        if (lastVisibleDoc) {
            qConstraints.push(startAfter(lastVisibleDoc));
        }
        
        const q = query(postsRef, ...qConstraints);
        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        return { posts, lastDoc: newLastDoc };

    } catch (error) {
        console.error("[getPostsByUserId] Error:", error);
        return { posts: [], lastDoc: null};
    }
}

export async function getPublicPosts(
  postsLimit: number = 10,
  lastVisibleDoc: DocumentSnapshot | null = null
): Promise<{ posts: PostData[], lastDoc: DocumentSnapshot | null }> {
    try {
        const postsRef = collection(db, 'posts');
        let qConstraints = [
            where("isPublic", "==", true),
            where("moderationStatus", "==", "approved"),
            orderBy("createdAt", "desc"),
            limit(postsLimit)
        ];
        
        if (lastVisibleDoc) {
            qConstraints.push(startAfter(lastVisibleDoc));
        }
        
        const q = query(postsRef, ...qConstraints);
        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        return { posts, lastDoc: newLastDoc };
    } catch (error) {
        console.error("[getPublicPosts] Error fetching public posts:", error);
        return { posts: [], lastDoc: null};
    }
}

export async function getPostsByUsers(
  userIds: string[], 
  postsLimit: number = 10,
  lastVisibleDoc: DocumentSnapshot | null = null
): Promise<{ posts: PostData[], lastDoc: DocumentSnapshot | null }> {
  if (!userIds || userIds.length === 0) {
    return { posts: [], lastDoc: null};
  }
  // Firestore 'in' queries are limited to 30 items per query.
  // For larger scale, a denormalized feed or multiple queries would be needed.
  const safeUserIds = userIds.slice(0, 30); 
  if (userIds.length > 30) {
      console.warn("[getPostsByUsers] Querying for more than 30 users. Results truncated to first 30 users for this query batch.");
  }

  try {
    const postsRef = collection(db, 'posts');
    let qConstraints = [
      where('userId', 'in', safeUserIds),
      where('isPublic', '==', true), // Usually, feed shows public posts from followed users
      where('moderationStatus', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    ];

    if (lastVisibleDoc) {
        qConstraints.push(startAfter(lastVisibleDoc));
    }

    const q = query(postsRef, ...qConstraints);
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    return { posts, lastDoc: newLastDoc };

  } catch (error) {
    console.error("[getPostsByUsers] Error fetching posts:", error);
    return { posts: [], lastDoc: null};
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
      // Add role-based deletion for admins/moderators if needed in future
      return { success: false, message: "You are not authorized to delete this post." };
    }

    // Delete associated media from Firebase Storage if contentUrl exists
    if (postData.contentUrl && postData.contentUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const fileRef = storageRefSdkFirebase(storage, postData.contentUrl);
        await deleteStorageObjectFirebase(fileRef);
        console.info(`[deletePost] Successfully deleted media for post ${postId} from Storage.`);
      } catch (storageError: any) {
        // Log error but don't block Firestore deletion if storage deletion fails (e.g. file already gone)
        if (storageError.code !== 'storage/object-not-found') {
          console.warn(`[deletePost] Error deleting media for post ${postId} from Storage: ${storageError.message}`);
        }
      }
    }
    
    // Delete the post document from Firestore
    await deleteDoc(postRef);
    console.info(`[deletePost] Successfully deleted post ${postId} from Firestore.`);
    // Cloud Function (onDeletePost) should handle decrementing user's postsCount and deleting related comments/likes.
    return { success: true, message: "Post deleted successfully." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    console.error(`[deletePost] Error deleting post ${postId}:`, errorMessage, error);
    return { success: false, message: `Failed to delete post: ${errorMessage}` };
  }
}
