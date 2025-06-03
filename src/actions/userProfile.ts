
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
  photoURL?: string; 
  bannerURL?: string; 
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
  followersCount?: number;
  followingCount?: number;
}

export async function saveUserProfile(userId: string, data: Partial<UserProfileData>): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }
  try {
    const userProfileRef = doc(db, 'users', userId);
    const profileSnapshot = await getDoc(userProfileRef);

    const dataToSave: Partial<UserProfileData> = { ...data };
    
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key as keyof UserProfileData] === undefined) {
        delete dataToSave[key as keyof UserProfileData];
      }
    });


    if (profileSnapshot.exists()) {
      await updateDoc(userProfileRef, {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(userProfileRef, {
        uid: userId,
        email: data.email ?? null,
        photoURL: data.photoURL ?? null,
        bannerURL: data.bannerURL ?? null,
        isPremium: data.isPremium ?? false,
        fluxSignature: data.fluxSignature ?? { dominantColors: [], keywords: [] }, 
        fluxEvolutionPoints: data.fluxEvolutionPoints ?? [], 
        followersCount: data.followersCount ?? 0,
        followingCount: data.followingCount ?? 0,
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
      const profile = docSnap.data() as UserProfileData;
      profile.fluxSignature = profile.fluxSignature ?? { dominantColors: [], keywords: [] };
      profile.fluxEvolutionPoints = profile.fluxEvolutionPoints ?? [];
      profile.photoURL = profile.photoURL ?? undefined;
      profile.bannerURL = profile.bannerURL ?? undefined;
      profile.followersCount = profile.followersCount ?? 0;
      profile.followingCount = profile.followingCount ?? 0;
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
