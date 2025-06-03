
'use server';

/**
 * @fileOverview Server actions for the Creative Stratosphere feature.
 * - getPublicFluxSignatures: Fetches public flux signatures for display.
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { FluxSignature, UserProfileData } from './userProfile';

export interface StratosphereItemData {
  userId: string;
  username?: string;
  fullName?: string;
  photoURL?: string;
  fluxSignature: FluxSignature;
}

// Firestore Security Rules Reminder for 'users' collection:
// Ensure 'users' collection is readable for fields needed by Stratosphere,
// especially fluxSignature, username, fullName, photoURL.
// A simplified rule might be:
// match /users/{userId} {
//   allow read: if true; // Or more specific for public profiles
//   // ... other rules
// }

export async function getPublicFluxSignatures(): Promise<StratosphereItemData[]> {
  try {
    const usersCollectionRef = collection(db, 'users');
    // Fetch all users. For large datasets, pagination or more specific querying (e.g., only active users) would be needed.
    // We also filter for users that actually have a fluxSignature defined.
    const q = query(usersCollectionRef, where("fluxSignature", "!=", null));
    const querySnapshot = await getDocs(q);

    const stratosphereItems: StratosphereItemData[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfileData;
      if (userData.fluxSignature && userData.fluxSignature.visualRepresentation) { // Ensure essential parts of signature exist
        stratosphereItems.push({
          userId: doc.id,
          username: userData.username,
          fullName: userData.fullName,
          photoURL: userData.photoURL,
          fluxSignature: userData.fluxSignature,
        });
      }
    });
    
    // Sort by some criteria, e.g., randomly for now, or by last active if available
    stratosphereItems.sort(() => 0.5 - Math.random());

    return stratosphereItems;
  } catch (error) {
    console.error("Error fetching public flux signatures: ", error);
    return [];
  }
}

// Placeholder for fetching "Creative Storms" - this would require more complex backend logic
// for tracking trends and interaction velocity.
export async function getCreativeStorms(): Promise<any[]> {
  console.warn("getCreativeStorms is not yet implemented.");
  return [];
}
