
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import type { StoryData } from '@/models/contentTypes';

const STORY_EXPIRY_HOURS = 24;

export async function createStory(
  userId: string,
  storyDetails: Omit<StoryData, 'id' | 'userId' | 'createdAt' | 'expiresAt' | 'viewsCount' | 'moderationStatus' | 'seenBy'>
): Promise<{ success: boolean; storyId?: string; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }
  if (!storyDetails.mediaUrl || !storyDetails.mediaType) {
    return { success: false, message: "Media URL and type are required." };
  }
  console.info(`[createStory] Attempting for userId: ${userId}`);

  try {
    const storiesCollectionRef = collection(db, 'stories');
    const now = Timestamp.now();
    const expiresAt = new Timestamp(now.seconds + STORY_EXPIRY_HOURS * 60 * 60, now.nanoseconds);

    const newStoryRef = await addDoc(storiesCollectionRef, {
      ...storyDetails,
      userId,
      viewsCount: 0,
      seenBy: [],
      moderationStatus: 'pending',
      createdAt: serverTimestamp(), 
      expiresAt,
    });
    console.info(`[createStory] Successfully created storyId: ${newStoryRef.id} for userId: ${userId}. Moderation: pending.`);
    // Cloud Function (onCreateStory) will handle user's storiesCount update & content moderation.
    return { success: true, storyId: newStoryRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    console.error("[createStory] Error:", errorMessage, error);
    return { success: false, message: `Failed to create story: ${errorMessage}` };
  }
}

export async function getActiveStoriesByUserId(userId: string): Promise<StoryData[]> {
  if (!userId) {
    console.warn("[getActiveStoriesByUserId] Missing userId.");
    return [];
  }
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where("userId", "==", userId),
      where("expiresAt", ">", Timestamp.now()),
      where("moderationStatus", "==", "approved"), // Only show approved stories
      orderBy("expiresAt", "asc"), 
      orderBy("createdAt", "desc") 
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoryData));
  } catch (error) {
    console.error("[getActiveStoriesByUserId] Error:", error);
    return [];
  }
}

export async function deleteStory(storyId: string, requestingUserId: string): Promise<{success: boolean, message?:string}> {
    if (!storyId || !requestingUserId) {
        return { success: false, message: "Story ID and User ID are required." };
    }
    console.info(`[deleteStory] Attempting deletion of story ${storyId} by user ${requestingUserId}`);
    try {
        const storyDocRef = doc(db, 'stories', storyId);
        const storySnap = await getDoc(storyDocRef);
        if (!storySnap.exists()) {
            return { success: false, message: "Story not found." };
        }
        if (storySnap.data()?.userId !== requestingUserId) {
            return { success: false, message: "User not authorized to delete this story." };
        }
        
        await deleteDoc(storyDocRef);
        console.info(`[deleteStory] Successfully deleted story ${storyId}`);
        // Cloud Function (onDeleteStory) will handle media deletion from Storage & user's storiesCount update.
        return { success: true };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[deleteStory] Error deleting story ${storyId}: ${msg}`);
        return { success: false, message: msg };
    }
}

export async function deleteExpiredStories(): Promise<void> {
  const now = Timestamp.now();
  const storiesRef = collection(db, 'stories');
  const q = query(storiesRef, where('expiresAt', '<=', now));
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("[deleteExpiredStories] No expired stories to delete.");
      return;
    }
    
    const batch = writeBatch(db); 
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      // Cloud Function (onDeleteStory) should be robust enough to be triggered by this
      // or you can directly call a helper to delete storage media if needed here, but triggers are cleaner.
    });
    await batch.commit();
    console.log(`[deleteExpiredStories] Deleted ${snapshot.size} expired stories.`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[deleteExpiredStories] Error: ${msg}`);
  }
}
    
