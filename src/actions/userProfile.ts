
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';

export interface FluxSignature {
  style?: string;
  activityLevel?: string; 
  currentMood?: string; 
  dominantColors?: string[]; // Array of hex color strings
  keywords?: string[];
  visualRepresentation?: string; // URL to an image
  dataAiHintVisual?: string;
}

export interface FluxEvolutionPoint {
  date: string; // Should be ISO string or 'YYYY-MM-DD'
  change: string;
}

export interface UserProfileData {
  uid: string;
  email?: string | null;
  fullName?: string;
  username?: string;
  bio?: string;
  genre?: string;
  style?: string;
  motivations?: string;
  inspirations?: string;
  website?: string;
  socialMedia?: string;
  location?: string;
  portfolioLink?: string;
  emailOptIn?: boolean;
  isPremium?: boolean;
  fluxSignature?: FluxSignature;
  fluxEvolutionPoints?: FluxEvolutionPoint[];
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
}

export async function saveUserProfile(userId: string, data: Partial<UserProfileData>): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }
  try {
    const userProfileRef = doc(db, 'users', userId);
    const profileSnapshot = await getDoc(userProfileRef);

    const dataToSave = { ...data };
    // Ensure timestamps are handled correctly
    if (profileSnapshot.exists()) {
      await updateDoc(userProfileRef, {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      });
    } else {
      // For new profiles, ensure all necessary fields including new ones are considered
      await setDoc(userProfileRef, {
        uid: userId,
        email: data.email ?? null,
        isPremium: data.isPremium ?? false,
        fluxSignature: data.fluxSignature ?? {}, // Initialize if not provided
        fluxEvolutionPoints: data.fluxEvolutionPoints ?? [], // Initialize if not provided
        ...dataToSave,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error saving user profile: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to save profile: ${errorMessage}` };
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  if (!userId) {
    return null;
  }
  try {
    const userProfileRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      // Explicitly cast to UserProfileData to ensure type safety
      const profile = docSnap.data() as UserProfileData;
      // Ensure fluxSignature and fluxEvolutionPoints are at least empty objects/arrays if not present
      profile.fluxSignature = profile.fluxSignature ?? { dominantColors: [], keywords: [] };
      profile.fluxEvolutionPoints = profile.fluxEvolutionPoints ?? [];
      return profile;
    } else {
      console.log("No such user profile!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile: ", error);
    return null;
  }
}

