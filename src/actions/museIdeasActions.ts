
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

// Firestore Security Rules Reminder for 'museIdeas' collection:
// match /museIdeas/{ideaId} {
//   allow read, create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//   // No update/delete for now, can be added if needed
// }

export async function saveMuseIdea(
  userId: string,
  input: GenerateMusePromptInput,
  output: GenerateMusePromptOutput
): Promise<{ success: boolean; ideaId?: string; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required to save a muse idea." };
  }

  try {
    const museIdeasCollectionRef = collection(db, 'museIdeas');
    const docRef = await addDoc(museIdeasCollectionRef, {
      userId,
      input,
      output,
      createdAt: serverTimestamp(),
    });
    return { success: true, ideaId: docRef.id };
  } catch (error) {
    console.error("Error saving muse idea: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to save muse idea: ${errorMessage}` };
  }
}

export async function getMuseIdeasByUserId(userId: string): Promise<MuseIdeaData[]> {
  if (!userId) {
    return [];
  }
  try {
    const museIdeasCollectionRef = collection(db, 'museIdeas');
    const q = query(museIdeasCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const ideas: MuseIdeaData[] = [];
    querySnapshot.forEach((doc) => {
      ideas.push({ id: doc.id, ...doc.data() } as MuseIdeaData);
    });
    return ideas;
  } catch (error) {
    console.error("Error fetching muse ideas by user ID: ", error);
    return [];
  }
}
