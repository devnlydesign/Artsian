
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import type { GenerateMusePromptInput, GenerateMusePromptOutput } from '@/ai/flows/algorithmic-muse-prompt';

export interface MuseIdeaData {
  id: string;
  userId: string;
  input: GenerateMusePromptInput;
  output: GenerateMusePromptOutput;
  createdAt: Timestamp;
}

export async function saveMuseIdea(
  userId: string,
  input: GenerateMusePromptInput,
  output: GenerateMusePromptOutput
): Promise<{ success: boolean; ideaId?: string; message?: string }> {
  if (!userId) {
    console.warn('[saveMuseIdea] Missing userId.');
    return { success: false, message: "User ID is required to save a muse idea." };
  }
  console.info(`[saveMuseIdea] Attempting for userId: ${userId}, mood: ${input.currentMood}`);

  try {
    const museIdeasCollectionRef = collection(db, 'museIdeas');
    const docRef = await addDoc(museIdeasCollectionRef, {
      userId,
      input,
      output,
      createdAt: serverTimestamp(),
    });
    console.info(`[saveMuseIdea] Successfully saved ideaId: ${docRef.id} for userId: ${userId}`);
    return { success: true, ideaId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[saveMuseIdea] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to save muse idea: ${errorMessage}` };
  }
}

export async function getMuseIdeasByUserId(userId: string): Promise<MuseIdeaData[]> {
  if (!userId) {
    console.warn('[getMuseIdeasByUserId] Missing userId.');
    return [];
  }
  // console.info(`[getMuseIdeasByUserId] Fetching for userId: ${userId}`);
  try {
    const museIdeasCollectionRef = collection(db, 'museIdeas');
    const q = query(museIdeasCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const ideas: MuseIdeaData[] = [];
    querySnapshot.forEach((doc) => {
      ideas.push({ id: doc.id, ...doc.data() } as MuseIdeaData);
    });
    // console.info(`[getMuseIdeasByUserId] Found ${ideas.length} ideas for userId: ${userId}`);
    return ideas;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getMuseIdeasByUserId] Error fetching ideas for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}
