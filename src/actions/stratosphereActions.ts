
'use server';

/**
 * @fileOverview Server actions for the Creative Stratosphere feature.
 * - getPublicFluxSignatures: Fetches public flux signatures for display.
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'; // Added orderBy
import type { FluxSignature, UserProfileData } from './userProfile';

export interface StratosphereItemData extends UserProfileData { // Extend UserProfileData to include all its fields
  // userId is part of UserProfileData as uid
  // username, fullName, photoURL, fluxSignature are part of UserProfileData
  // isProfileAmplified and profileAmplifiedAt are now part of UserProfileData
}

// Firestore Security Rules Reminder for 'users' collection:
// Ensure 'users' collection is readable for fields needed by Stratosphere,
// especially fluxSignature, username, fullName, photoURL, isProfileAmplified, profileAmplifiedAt.
// A simplified rule might be:
// match /users/{userId} {
//   allow read: if true; // Or more specific for public profiles
//   // ... other rules
// }

export async function getPublicFluxSignatures(): Promise<StratosphereItemData[]> {
  try {
    const usersCollectionRef = collection(db, 'users');
    // Fetch all users. For large datasets, pagination or more specific querying would be needed.
    // We filter for users that actually have a fluxSignature defined.
    // Order by isProfileAmplified (desc) then by profileAmplifiedAt (desc) if amplified, then by createdAt (desc) for others.
    // Firestore limitations: Multiple orderBy calls need to be on different fields unless one is an inequality.
    // A composite index for (isProfileAmplified, profileAmplifiedAt, createdAt) might be needed.
    // For simplicity now, we'll fetch and sort in code, but this is not ideal for large datasets.
    // const q = query(usersCollectionRef, 
    //   where("fluxSignature", "!=", null),
    //   orderBy("isProfileAmplified", "desc"), // This requires an index
    //   orderBy("profileAmplifiedAt", "desc"), // This requires an index with isProfileAmplified
    //   orderBy("createdAt", "desc")
    // );
    // Simpler query for now, sort client-side due to Firestore query complexity with multiple conditional orders.
    const q = query(usersCollectionRef, where("fluxSignature", "!=", null), orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(q);

    const stratosphereItems: StratosphereItemData[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfileData;
      if (userData.fluxSignature && userData.fluxSignature.visualRepresentation) { 
        stratosphereItems.push({
          uid: doc.id, // Ensure uid is part of the pushed object
          ...userData,
          isProfileAmplified: userData.isProfileAmplified ?? false,
          profileAmplifiedAt: userData.profileAmplifiedAt ?? null,
        } as StratosphereItemData);
      }
    });
    
    // Sort items: amplified profiles first, then by amplification time, then by creation time
    stratosphereItems.sort((a, b) => {
      if (a.isProfileAmplified && !b.isProfileAmplified) return -1;
      if (!a.isProfileAmplified && b.isProfileAmplified) return 1;
      if (a.isProfileAmplified && b.isProfileAmplified) {
        const timeA = a.profileAmplifiedAt?.toMillis() || 0;
        const timeB = b.profileAmplifiedAt?.toMillis() || 0;
        if (timeA !== timeB) return timeB - timeA; // Most recently amplified first
      }
      const createdAtA = a.createdAt?.toMillis() || 0;
      const createdAtB = b.createdAt?.toMillis() || 0;
      return createdAtB - createdAtA; // Most recently created first
    });

    return stratosphereItems;
  } catch (error) {
    console.error("Error fetching public flux signatures: ", error);
    return [];
  }
}

// Placeholder for fetching "Creative Storms"
export async function getCreativeStorms(): Promise<any[]> {
  console.warn("getCreativeStorms is not yet implemented.");
  return [];
}
