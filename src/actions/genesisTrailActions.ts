
'use server';

/**
 * @fileOverview Server actions for managing Genesis Trails.
 *
 * - saveGenesisTrail: Saves a generated genesis trail to Firestore.
 * - getGenesisTrailsByUserId: Retrieves all genesis trails for a given user.
 * - GenesisTrailStorageData: Interface for the data stored in Firestore.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import type { GenesisTrailInput, GenesisTrailOutput } from '@/ai/flows/genesis-trail-generation';

export interface GenesisTrailStorageData {
  id: string;
  userId: string;
  input: GenesisTrailInput;
  output: GenesisTrailOutput;
  createdAt: Timestamp;
  projectTitle?: string; // Extracted from projectDescription for easier display
}

// Firestore Security Rules Reminder for 'genesisTrails' collection:
// match /genesisTrails/{trailId} {
//   allow read, create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//   // No update/delete for now
// }

export async function saveGenesisTrail(
  userId: string,
  input: GenesisTrailInput,
  output: GenesisTrailOutput
): Promise<{ success: boolean; trailId?: string; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required to save a genesis trail." };
  }

  try {
    const genesisTrailsCollectionRef = collection(db, 'genesisTrails');
    // Extract a title from the description for easier listing, fallback if needed
    const projectTitle = input.projectDescription.substring(0, 70) + (input.projectDescription.length > 70 ? '...' : '');

    const docRef = await addDoc(genesisTrailsCollectionRef, {
      userId,
      input,
      output,
      projectTitle,
      createdAt: serverTimestamp(),
    });
    return { success: true, trailId: docRef.id };
  } catch (error) {
    console.error("Error saving genesis trail: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to save genesis trail: ${errorMessage}` };
  }
}

export async function getGenesisTrailsByUserId(userId: string): Promise<GenesisTrailStorageData[]> {
  if (!userId) {
    return [];
  }
  try {
    const genesisTrailsCollectionRef = collection(db, 'genesisTrails');
    const q = query(genesisTrailsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const trails: GenesisTrailStorageData[] = [];
    querySnapshot.forEach((doc) => {
      trails.push({ id: doc.id, ...doc.data() } as GenesisTrailStorageData);
    });
    return trails;
  } catch (error) {
    console.error("Error fetching genesis trails by user ID: ", error);
    return [];
  }
}
