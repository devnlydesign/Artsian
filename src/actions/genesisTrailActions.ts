
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
  projectTitle?: string; 
}

export async function saveGenesisTrail(
  userId: string,
  input: GenesisTrailInput,
  output: GenesisTrailOutput
): Promise<{ success: boolean; trailId?: string; message?: string }> {
  if (!userId) {
    console.warn('[saveGenesisTrail] Missing userId.');
    return { success: false, message: "User ID is required to save a genesis trail." };
  }
  console.info(`[saveGenesisTrail] Attempting for userId: ${userId}, project: ${input.projectDescription.substring(0,30)}...`);

  try {
    const genesisTrailsCollectionRef = collection(db, 'genesisTrails');
    const projectTitle = input.projectDescription.substring(0, 70) + (input.projectDescription.length > 70 ? '...' : '');

    const docRef = await addDoc(genesisTrailsCollectionRef, {
      userId,
      input,
      output,
      projectTitle,
      createdAt: serverTimestamp(),
    });
    console.info(`[saveGenesisTrail] Successfully saved trailId: ${docRef.id} for userId: ${userId}`);
    return { success: true, trailId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[saveGenesisTrail] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to save genesis trail: ${errorMessage}` };
  }
}

export async function getGenesisTrailsByUserId(userId: string): Promise<GenesisTrailStorageData[]> {
  if (!userId) {
    console.warn('[getGenesisTrailsByUserId] Missing userId.');
    return [];
  }
  // console.info(`[getGenesisTrailsByUserId] Fetching for userId: ${userId}`);
  try {
    const genesisTrailsCollectionRef = collection(db, 'genesisTrails');
    const q = query(genesisTrailsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const trails: GenesisTrailStorageData[] = [];
    querySnapshot.forEach((doc) => {
      trails.push({ id: doc.id, ...doc.data() } as GenesisTrailStorageData);
    });
    // console.info(`[getGenesisTrailsByUserId] Found ${trails.length} trails for userId: ${userId}`);
    return trails;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getGenesisTrailsByUserId] Error fetching trails for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}
