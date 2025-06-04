
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { SocialReelData } from '@/models/contentTypes'; // Updated import

// This file is updated to use SocialReelData from the new models.
// The old ReelData interface is effectively replaced by SocialReelData.

export async function createSocialReel( // Renamed from createReel
  userId: string,
  creatorName: string | null | undefined,
  creatorAvatarUrl: string | null | undefined,
  reelDetails: Omit<SocialReelData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isPublished' | 'moderationStatus' | 'viewsCount'>
): Promise<{ success: boolean; reelId?: string; message?: string }> {
  if (!userId) {
    const msg = '[createSocialReel] Missing userId.';
    console.warn(msg);
    return { success: false, message: "User ID is required to create a reel." };
  }
  if (!reelDetails.videoUrl) {
    const msg = `[createSocialReel] Missing videoUrl for userId: ${userId}`;
    console.warn(msg);
    return { success: false, message: "Video URL is required." };
  }
  console.info(`[createSocialReel] Attempting for userId: ${userId}`);

  try {
    const reelsCollectionRef = collection(db, 'reels');
    
    const docRef = await addDoc(reelsCollectionRef, {
      ...reelDetails,
      userId,
      // Creator name and avatar are not part of SocialReelData schema,
      // but can be fetched from UserProfileData using userId when displaying.
      // If you denormalize, ensure they are updated if user profile changes.
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      isPublished: reelDetails.isPublished ?? true, // Default to published
      moderationStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createSocialReel] Successfully created reelId: ${docRef.id} for userId: ${userId}. Moderation status: pending.`);
    // TODO: Trigger content moderation Cloud Function here for the new reel (docRef.id)
    // TODO: Trigger Cloud Function to update user's reelsCount on UserProfileData
    return { success: true, reelId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createSocialReel] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create reel: ${errorMessage}` };
  }
}

// Other reel-related actions like getReelById, getReelsByUser, updateReel, deleteReel would be added here.
// Example:
// export async function getReelById(reelId: string): Promise<SocialReelData | null> { ... }
// export async function getReelsByUserId(userId: string): Promise<SocialReelData[]> { ... }
    
    