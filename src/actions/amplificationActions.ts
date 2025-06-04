
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { ArtworkData } from './artworkActions';
import type { UserProfileData } from './userProfile';

// Firestore Security Rules Reminder:
// Ensure rules allow the user to update their own artworks/profile with amplification fields.
// Example for 'artworks/{artworkId}':
//   allow update: if request.auth.uid == resource.data.userId && 
//                     (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isAmplified', 'amplifiedAt', 'updatedAt']) ||
//                      !request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAmplified', 'amplifiedAt'])); 
// Similar rule for 'users/{userId}'.

export async function amplifyArtwork(
  userId: string,
  artworkId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !artworkId) {
    console.warn('[amplifyArtwork] Missing userId or artworkId.');
    return { success: false, message: 'User ID and Artwork ID are required.' };
  }
  console.info(`[amplifyArtwork] Attempting for userId: ${userId}, artworkId: ${artworkId}`);

  const artworkRef = doc(db, 'artworks', artworkId);
  try {
    const artworkSnap = await getDoc(artworkRef);
    if (!artworkSnap.exists() || artworkSnap.data()?.userId !== userId) {
      console.warn(`[amplifyArtwork] Artwork not found or permission denied for userId: ${userId}, artworkId: ${artworkId}`);
      return { success: false, message: 'Artwork not found or you do not have permission to amplify it.' };
    }

    await updateDoc(artworkRef, {
      isAmplified: true,
      amplifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[amplifyArtwork] Successfully amplified artworkId: ${artworkId} for userId: ${userId}`);
    return { success: true, message: 'Artwork successfully amplified!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[amplifyArtwork] Error for userId: ${userId}, artworkId: ${artworkId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to amplify artwork: ${errorMessage}` };
  }
}

export async function removeArtworkAmplification(
  userId: string,
  artworkId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !artworkId) {
    console.warn('[removeArtworkAmplification] Missing userId or artworkId.');
    return { success: false, message: 'User ID and Artwork ID are required.' };
  }
  console.info(`[removeArtworkAmplification] Attempting for userId: ${userId}, artworkId: ${artworkId}`);
  
  const artworkRef = doc(db, 'artworks', artworkId);
  try {
    const artworkSnap = await getDoc(artworkRef);
    if (!artworkSnap.exists() || artworkSnap.data()?.userId !== userId) {
      console.warn(`[removeArtworkAmplification] Artwork not found or permission denied for userId: ${userId}, artworkId: ${artworkId}`);
      return { success: false, message: 'Artwork not found or you do not have permission to modify it.' };
    }

    await updateDoc(artworkRef, {
      isAmplified: false,
      amplifiedAt: null, 
      updatedAt: serverTimestamp(),
    });
    console.info(`[removeArtworkAmplification] Successfully removed amplification for artworkId: ${artworkId}, userId: ${userId}`);
    return { success: true, message: 'Artwork amplification removed.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[removeArtworkAmplification] Error for userId: ${userId}, artworkId: ${artworkId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to remove artwork amplification: ${errorMessage}` };
  }
}

export async function amplifyUserProfile(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    console.warn('[amplifyUserProfile] Missing userId.');
    return { success: false, message: 'User ID is required.' };
  }
  console.info(`[amplifyUserProfile] Attempting for userId: ${userId}`);

  const userProfileRef = doc(db, 'users', userId);
  try {
    await updateDoc(userProfileRef, {
      isProfileAmplified: true,
      profileAmplifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[amplifyUserProfile] Successfully amplified profile for userId: ${userId}`);
    return { success: true, message: 'Profile successfully amplified!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[amplifyUserProfile] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to amplify profile: ${errorMessage}` };
  }
}

export async function removeProfileAmplification(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    console.warn('[removeProfileAmplification] Missing userId.');
    return { success: false, message: 'User ID is required.' };
  }
  console.info(`[removeProfileAmplification] Attempting for userId: ${userId}`);

  const userProfileRef = doc(db, 'users', userId);
  try {
    await updateDoc(userProfileRef, {
      isProfileAmplified: false,
      profileAmplifiedAt: null,
      updatedAt: serverTimestamp(),
    });
    console.info(`[removeProfileAmplification] Successfully removed profile amplification for userId: ${userId}`);
    return { success: true, message: 'Profile amplification removed.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[removeProfileAmplification] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to remove profile amplification: ${errorMessage}` };
  }
}
