
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { StoryData } from '@/models/contentTypes';

// Server actions for managing Stories

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
      createdAt: serverTimestamp(), // Will be set by server
      expiresAt,
    });
    // TODO: Trigger Cloud Function to update user's storiesCount
    // TODO: Trigger content moderation Cloud Function
    return { success: true, storyId: newStoryRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    console.error("[createStory] Error:", errorMessage, error);
    return { success: false, message: `Failed to create story: ${errorMessage}` };
  }
}

export async function getActiveStoriesByUserId(userId: string): Promise<StoryData[]> {
  if (!userId) return [];
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where("userId", "==", userId),
      where("expiresAt", ">", Timestamp.now()),
      where("moderationStatus", "==", "approved"),
      orderBy("expiresAt", "asc"), // Show soonest to expire first, or createdAt desc for newest
      orderBy("createdAt", "desc") 
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoryData));
  } catch (error) {
    console.error("[getActiveStoriesByUserId] Error:", error);
    return [];
  }
}

export async function deleteStory(storyId: string, userId: string): Promise<{success: boolean, message?:string}> {
    // TODO: Add security check to ensure userId is owner of story
    try {
        await deleteDoc(doc(db, 'stories', storyId));
        // TODO: Trigger Cloud Function to delete associated media from Storage
        // TODO: Trigger Cloud Function to update user's storiesCount
        return { success: true };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[deleteStory] Error deleting story ${storyId}: ${msg}`);
        return { success: false, message: msg };
    }
}

// Function to delete expired stories (can be run by a scheduled Cloud Function)
export async function deleteExpiredStories(): Promise<void> {
  const now = Timestamp.now();
  const storiesRef = collection(db, 'stories');
  const q = query(storiesRef, where('expiresAt', '<=', now));
  const snapshot = await getDocs(q);
  
  const batch = db.batch(); // Assuming db is Firestore instance from firebaseAdmin
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
    // TODO: Trigger deletion of associated media from Firebase Storage
  });
  await batch.commit();
  console.log(`Deleted ${snapshot.size} expired stories.`);
}
    