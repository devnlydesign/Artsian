
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import type { MusicData } from '@/models/contentTypes';

export async function createMusicTrack(
  userId: string,
  musicDetails: Omit<MusicData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'playsCount' | 'likesCount' | 'isPublished' | 'moderationStatus'>
): Promise<{ success: boolean; musicId?: string; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required to create a music track." };
  }
  if (!musicDetails.audioUrl || !musicDetails.title || !musicDetails.artist) {
    return { success: false, message: "Audio URL, title, and artist are required." };
  }
  console.info(`[createMusicTrack] Attempting for userId: ${userId}, title: ${musicDetails.title}`);

  try {
    const musicCollectionRef = collection(db, 'music');
    
    const docRef = await addDoc(musicCollectionRef, {
      ...musicDetails,
      userId,
      playsCount: 0,
      likesCount: 0,
      isPublished: true, // Default to published, can be changed via update action
      moderationStatus: 'pending', // Default to pending moderation
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createMusicTrack] Successfully created musicId: ${docRef.id} for userId: ${userId}. Moderation: pending.`);
    // Cloud Function (onMusicCreated) could handle user's musicCount update & content moderation.
    return { success: true, musicId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createMusicTrack] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create music track: ${errorMessage}` };
  }
}

export async function getMusicTracksByUserId(userId: string): Promise<MusicData[]> {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, 'music'),
      where("userId", "==", userId),
      // where("isPublished", "==", true), // If only showing published on profile
      // where("moderationStatus", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicData));
  } catch (error) {
    console.error(`[getMusicTracksByUserId] Error fetching music for userId ${userId}:`, error);
    return [];
  }
}

export async function getMusicTrackById(musicId: string): Promise<MusicData | null> {
  if (!musicId) return null;
  try {
    const musicDocRef = doc(db, 'music', musicId);
    const docSnap = await getDoc(musicDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Add visibility checks if needed for public view
        // if (!data.isPublished || data.moderationStatus !== 'approved') return null;
        return { id: docSnap.id, ...data } as MusicData;
    }
    return null;
  } catch (error) {
    console.error(`[getMusicTrackById] Error fetching musicId ${musicId}:`, error);
    return null;
  }
}

// Future actions: updateMusicTrack, deleteMusicTrack
