
'use server';

/**
 * @fileOverview Server actions for the Creative Stratosphere feature.
 * - getPublicFluxSignatures: Fetches public flux signatures for display.
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore'; 
import type { FluxSignature, UserProfileData } from './userProfile';

export interface StratosphereItemData extends UserProfileData { 
}

export async function getPublicFluxSignatures(): Promise<StratosphereItemData[]> {
  // console.info("[getPublicFluxSignatures] Fetching public flux signatures."); // Can be noisy
  try {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where("fluxSignature", "!=", null), orderBy("createdAt", "desc")); // Simpler query for now
    
    const querySnapshot = await getDocs(q);

    const stratosphereItems: StratosphereItemData[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfileData;
      if (userData.fluxSignature && userData.fluxSignature.visualRepresentation) { 
        stratosphereItems.push({
          uid: doc.id, 
          ...userData,
          isProfileAmplified: userData.isProfileAmplified ?? false,
          profileAmplifiedAt: userData.profileAmplifiedAt ?? null,
        } as StratosphereItemData);
      }
    });
    
    stratosphereItems.sort((a, b) => {
      if (a.isProfileAmplified && !b.isProfileAmplified) return -1;
      if (!a.isProfileAmplified && b.isProfileAmplified) return 1;
      if (a.isProfileAmplified && b.isProfileAmplified) {
        const timeA = (a.profileAmplifiedAt as Timestamp | null)?.toMillis() || 0; // Cast to Timestamp
        const timeB = (b.profileAmplifiedAt as Timestamp | null)?.toMillis() || 0; // Cast to Timestamp
        if (timeA !== timeB) return timeB - timeA; 
      }
      const createdAtA = (a.createdAt as Timestamp | null)?.toMillis() || 0; // Cast to Timestamp
      const createdAtB = (b.createdAt as Timestamp | null)?.toMillis() || 0; // Cast to Timestamp
      return createdAtB - createdAtA; 
    });
    // console.info(`[getPublicFluxSignatures] Found ${stratosphereItems.length} items.`);
    return stratosphereItems;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getPublicFluxSignatures] Error: ${errorMessage}`, error);
    return [];
  }
}

export async function getCreativeStorms(): Promise<any[]> {
  console.warn("[getCreativeStorms] is not yet implemented.");
  return [];
}
