
'use server';

/**
 * @fileOverview Server actions for the Creative Stratosphere feature.
 * - getPublicFluxSignatures: Fetches public flux signatures for display.
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore'; // Added limit
import type { FluxSignature, UserProfileData } from './userProfile';

export interface StratosphereItemData extends UserProfileData {
}

export async function getPublicFluxSignatures(queryLimit: number = 50): Promise<StratosphereItemData[]> {
  // console.info("[getPublicFluxSignatures] Fetching public flux signatures.");
  try {
    const usersCollectionRef = collection(db, 'users');
    // PERFORMANCE & SCALABILITY:
    // 1. Ensure composite index on (fluxSignature (exists), moderationStatus, createdAt) and (fluxSignature (exists), moderationStatus, profileAmplifiedAt, createdAt) if Firestore requires.
    //    Since fluxSignature is an object, we check for its existence.
    // 2. Implemented limit for pagination. Frontend would need to handle 'load more'.
    // 3. CONTENT MODERATION: Added where("moderationStatus", "==", "approved") to show only approved profiles.
    const q = query(
      usersCollectionRef,
      where("fluxSignature", "!=", null), // Ensure fluxSignature exists
      where("moderationStatus", "==", "approved"), // Only approved profiles
      orderBy("profileAmplifiedAt", "desc"), // Amplified profiles first (nulls last by default or handle explicitly)
      orderBy("createdAt", "desc"),
      limit(queryLimit)
    );

    const querySnapshot = await getDocs(q);

    const stratosphereItems: StratosphereItemData[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfileData;
      // Ensure fluxSignature itself and its visualRepresentation exist, and profile is approved
      if (userData.fluxSignature && userData.fluxSignature.visualRepresentation && userData.moderationStatus === 'approved') {
        stratosphereItems.push({
          uid: doc.id,
          ...userData,
          isProfileAmplified: userData.isProfileAmplified ?? false,
          profileAmplifiedAt: userData.profileAmplifiedAt ?? null,
          // moderationStatus and moderationInfo are already part of UserProfileData
        } as StratosphereItemData);
      }
    });

    // Custom sort to ensure amplified profiles are always first, then by amplifiedAt, then by createdAt
    stratosphereItems.sort((a, b) => {
      if (a.isProfileAmplified && !b.isProfileAmplified) return -1;
      if (!a.isProfileAmplified && b.isProfileAmplified) return 1;
      if (a.isProfileAmplified && b.isProfileAmplified) {
        const timeA = (a.profileAmplifiedAt as Timestamp | null)?.toMillis() || 0;
        const timeB = (b.profileAmplifiedAt as Timestamp | null)?.toMillis() || 0;
        if (timeA !== timeB) return timeB - timeA;
      }
      const createdAtA = (a.createdAt as Timestamp | null)?.toMillis() || 0;
      const createdAtB = (b.createdAt as Timestamp | null)?.toMillis() || 0;
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
  console.warn("[getCreativeStorms] is not yet implemented. This would require significant backend aggregation logic.");
  // Placeholder:
  // 1. Define what constitutes a "storm" (e.g., trending tags, high-velocity interaction on specific artworks/themes).
  // 2. Implement Firebase Cloud Functions (scheduled) to:
  //    - Analyze interaction data (likes, comments, shares, views on artworks; new followers for artists).
  //    - Identify clusters or rapidly growing nodes.
  //    - Store these "storms" (e.g., in a 'creativeStorms' collection) with metadata (theme, involved artists, intensity score, duration).
  // 3. This function would then query that pre-aggregated 'creativeStorms' collection.
  return [];
}
