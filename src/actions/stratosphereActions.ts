
'use server';

/**
 * @fileOverview Server actions for the Creative Stratosphere feature.
 * - getPublicFluxSignatures: Fetches public flux signatures for display.
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore'; 
import type { FluxSignature, UserProfileData } from './userProfile';

export interface StratosphereItemData extends UserProfileData {
}

export async function getPublicFluxSignatures(queryLimit: number = 50): Promise<StratosphereItemData[]> {
  try {
    const usersCollectionRef = collection(db, 'users');
    
    const q = query(
      usersCollectionRef,
      where("hasFluxSignature", "==", true), // Querying on the new boolean field
      where("moderationStatus", "==", "approved"), 
      orderBy("isProfileAmplified", "desc"), // Sort amplified profiles first
      orderBy("profileAmplifiedAt", "desc"), 
      orderBy("createdAt", "desc"),
      limit(queryLimit)
    );

    const querySnapshot = await getDocs(q);

    const stratosphereItems: StratosphereItemData[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfileData;
      // fluxSignature presence already guaranteed by 'hasFluxSignature' query
      if (userData.fluxSignature && userData.fluxSignature.visualRepresentation && userData.moderationStatus === 'approved') {
        stratosphereItems.push({
          uid: doc.id,
          ...userData,
          isProfileAmplified: userData.isProfileAmplified ?? false,
          profileAmplifiedAt: userData.profileAmplifiedAt ?? null,
        } as StratosphereItemData);
      }
    });
    
    // The Firestore query should handle primary sorting.
    // Client-side sort might not be needed if Firestore order is sufficient.
    // However, if 'isProfileAmplified' (boolean) needs stricter true-first sorting than Firestore's default for booleans with subsequent orderBy, keep it.
    // Firestore usually sorts boolean false before true for ASC, true before false for DESC.
    // So `orderBy("isProfileAmplified", "desc")` correctly puts true (amplified) first.

    return stratosphereItems;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getPublicFluxSignatures] Error: ${errorMessage}`, error);
    return [];
  }
}

export async function getCreativeStorms(): Promise<any[]> {
  console.warn("[getCreativeStorms] is not yet implemented. This would require significant backend aggregation logic.");
  return [];
}

