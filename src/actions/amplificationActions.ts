
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
    return { success: false, message: 'User ID and Artwork ID are required.' };
  }

  const artworkRef = doc(db, 'artworks', artworkId);
  try {
    const artworkSnap = await getDoc(artworkRef);
    if (!artworkSnap.exists() || artworkSnap.data()?.userId !== userId) {
      return { success: false, message: 'Artwork not found or you do not have permission to amplify it.' };
    }

    await updateDoc(artworkRef, {
      isAmplified: true,
      amplifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Artwork successfully amplified!' };
  } catch (error) {
    console.error('Error amplifying artwork:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to amplify artwork: ${errorMessage}` };
  }
}

export async function removeArtworkAmplification(
  userId: string,
  artworkId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !artworkId) {
    return { success: false, message: 'User ID and Artwork ID are required.' };
  }

  const artworkRef = doc(db, 'artworks', artworkId);
  try {
    const artworkSnap = await getDoc(artworkRef);
    if (!artworkSnap.exists() || artworkSnap.data()?.userId !== userId) {
      return { success: false, message: 'Artwork not found or you do not have permission to modify it.' };
    }

    await updateDoc(artworkRef, {
      isAmplified: false,
      amplifiedAt: null, // Or keep the last amplified time if needed for history
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Artwork amplification removed.' };
  } catch (error) {
    console.error('Error removing artwork amplification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to remove artwork amplification: ${errorMessage}` };
  }
}

export async function amplifyUserProfile(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }

  const userProfileRef = doc(db, 'users', userId);
  try {
    await updateDoc(userProfileRef, {
      isProfileAmplified: true,
      profileAmplifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Profile successfully amplified!' };
  } catch (error) {
    console.error('Error amplifying profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to amplify profile: ${errorMessage}` };
  }
}

export async function removeProfileAmplification(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }

  const userProfileRef = doc(db, 'users', userId);
  try {
    await updateDoc(userProfileRef, {
      isProfileAmplified: false,
      profileAmplifiedAt: null,
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Profile amplification removed.' };
  } catch (error) {
    console.error('Error removing profile amplification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to remove profile amplification: ${errorMessage}` };
  }
}
