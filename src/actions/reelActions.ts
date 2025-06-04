
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface ReelData {
  id: string;
  userId: string; // Creator's UID
  creatorName?: string; // Denormalized for display
  creatorAvatarUrl?: string | null; // Denormalized
  videoUrl: string;
  dataAiHintVideo?: string; // For accessibility or future AI features on the video itself
  caption?: string;
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  isPublished?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
  };
}

export async function createReel(
  userId: string,
  creatorName: string | null | undefined,
  creatorAvatarUrl: string | null | undefined,
  reelDetails: Omit<ReelData, 'id' | 'userId' | 'creatorName' | 'creatorAvatarUrl' | 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount' | 'commentCount' | 'isPublished' | 'moderationStatus' | 'moderationInfo'>
): Promise<{ success: boolean; reelId?: string; message?: string }> {
  if (!userId) {
    console.warn('[createReel] Missing userId.');
    return { success: false, message: "User ID is required to create a reel." };
  }
  if (!reelDetails.videoUrl) {
    console.warn(`[createReel] Missing videoUrl for userId: ${userId}`);
    return { success: false, message: "Video URL is required." };
  }
  console.info(`[createReel] Attempting for userId: ${userId}`);

  try {
    const reelsCollectionRef = collection(db, 'reels');
    
    const docRef = await addDoc(reelsCollectionRef, {
      ...reelDetails,
      userId,
      creatorName: creatorName || "Charisarthub Artist",
      creatorAvatarUrl: creatorAvatarUrl || null,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isPublished: true, // Or false if it needs explicit publishing step
      moderationStatus: 'pending', // All new content starts as pending moderation
      moderationInfo: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createReel] Successfully created reelId: ${docRef.id} for userId: ${userId}. Moderation status: pending.`);
    // TODO: Trigger content moderation Cloud Function here for the new reel (docRef.id)
    // This function would analyze reelDetails.videoUrl (if possible, or its thumbnail) and reelDetails.caption
    return { success: true, reelId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createReel] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create reel: ${errorMessage}` };
  }
}

// Future actions: getReelById, getReelsByUser, updateReel, deleteReel, incrementReelCounts etc.
    