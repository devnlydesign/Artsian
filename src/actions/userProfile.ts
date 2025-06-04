
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
  fullName?: string; // Used for display names
  username?: string; // Unique identifier, can be used for @mentions or profile URLs
  bio?: string;
  photoURL?: string | null; // Profile picture URL
  bannerURL?: string | null; // Profile banner image URL
  genre?: string; // Main art genre
  style?: string; // Artistic style description
  motivations?: string;
  inspirations?: string;
  website?: string;
  socialMedia?: string; // Could be a single link or an object for multiple platforms
  location?: string;
  portfolioLink?: string; // Link to an external portfolio
  emailOptIn?: boolean;
  isPremium?: boolean;
  stripeCustomerId?: string | null;
  premiumSubscriptionId?: string | null; // Stripe Subscription ID for app premium
  premiumSubscriptionEndsAt?: Timestamp | null; // When the current premium period ends
  fluxSignature?: FluxSignature;
  fluxEvolutionPoints?: FluxEvolutionPoint[];
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
  followersCount?: number;
  followingCount?: number;
  isProfileAmplified?: boolean; // For Amplify Flux Pulse feature
  profileAmplifiedAt?: Timestamp | null; // Timestamp of when profile was last amplified
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
      const K = key as keyof UserProfileData;
      if (dataToSave[K] === undefined) {
        delete dataToSave[K]; 
      }
    });


    if (profileSnapshot.exists()) {
      await updateDoc(userProfileRef, {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Defaults for new profiles
      await setDoc(userProfileRef, {
        uid: userId,
        email: data.email ?? null,
        fullName: data.fullName ?? '', // Default to empty string
        username: data.username ?? '', // Default to empty string
        photoURL: data.photoURL ?? null,
        bannerURL: data.bannerURL ?? null,
        isPremium: data.isPremium ?? false,
        stripeCustomerId: data.stripeCustomerId ?? null,
        premiumSubscriptionId: data.premiumSubscriptionId ?? null,
        premiumSubscriptionEndsAt: data.premiumSubscriptionEndsAt ?? null,
        fluxSignature: data.fluxSignature ?? { dominantColors: [], keywords: [] }, 
        fluxEvolutionPoints: data.fluxEvolutionPoints ?? [], 
        followersCount: data.followersCount ?? 0,
        followingCount: data.followingCount ?? 0,
        isProfileAmplified: data.isProfileAmplified ?? false,
        profileAmplifiedAt: data.profileAmplifiedAt ?? null,
        emailOptIn: data.emailOptIn ?? false,
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
      // Ensure all potentially undefined fields have sensible defaults if needed by calling code
      profile.fullName = profile.fullName ?? '';
      profile.username = profile.username ?? '';
      profile.fluxSignature = profile.fluxSignature ?? { dominantColors: [], keywords: [] };
      profile.fluxEvolutionPoints = profile.fluxEvolutionPoints ?? [];
      profile.photoURL = profile.photoURL ?? null;
      profile.bannerURL = profile.bannerURL ?? null;
      profile.followersCount = profile.followersCount ?? 0;
      profile.followingCount = profile.followingCount ?? 0;
      profile.stripeCustomerId = profile.stripeCustomerId ?? null;
      profile.isPremium = profile.isPremium ?? false;
      profile.premiumSubscriptionId = profile.premiumSubscriptionId ?? null;
      profile.premiumSubscriptionEndsAt = profile.premiumSubscriptionEndsAt ?? null;
      profile.emailOptIn = profile.emailOptIn ?? false;
      profile.isProfileAmplified = profile.isProfileAmplified ?? false;
      profile.profileAmplifiedAt = profile.profileAmplifiedAt ?? null;
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
