
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';

export interface FluxSignature {
  style?: string;
  activityLevel?: string;
  currentMood?: string;
  dominantColors?: string[];
  keywords?: string[];
  visualRepresentation?: string; 
  visualRepresentation_original?: string; 
  visualRepresentation_thumbnail_400x400?: string; 
  dataAiHintVisual?: string;
}

export interface FluxEvolutionPoint {
  date: string;
  change: string;
}

export interface UserProfileThemeSettings {
  baseMode?: 'light' | 'dark' | 'system';
  customColors?: {
    light: { [key: string]: string };
    dark: { [key: string]: string };
  };
}

export interface UserProfileData {
  uid: string;
  email?: string | null;
  fullName?: string;
  username?: string;
  bio?: string;
  photoURL?: string | null; 
  photoURLOriginal?: string | null; 
  bannerURL?: string | null; 
  bannerURLOriginal?: string | null; 
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
  premiumTier?: "standard" | "plus" | "studioCreative" | "none";
  subscriptionId?: string | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "unpaid";
  currentPeriodEnd?: Timestamp | null;
  stripeCustomerId?: string | null;
  premiumSubscriptionId?: string | null; 
  premiumSubscriptionEndsAt?: Timestamp | null; 
  fluxSignature?: FluxSignature;
  hasFluxSignature?: boolean; // New field
  fluxEvolutionPoints?: FluxEvolutionPoint[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  followersCount?: number;
  followingCount?: number;
  isProfileAmplified?: boolean;
  profileAmplifiedAt?: Timestamp | null;
  themeSettings?: UserProfileThemeSettings;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
    fields?: ('username' | 'bio' | 'photoURL' | 'bannerURL')[];
  };
}

export async function saveUserProfile(userId: string, data: Partial<UserProfileData>): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    console.warn('[saveUserProfile] Missing userId.');
    return { success: false, message: "User ID is required." };
  }
  console.info(`[saveUserProfile] Attempting for userId: ${userId}`);

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
    
    if (data.photoURL && (!profileSnapshot.exists() || data.photoURL !== profileSnapshot.data()?.photoURL)) {
      dataToSave.photoURLOriginal = data.photoURL;
    }
    if (data.bannerURL && (!profileSnapshot.exists() || data.bannerURL !== profileSnapshot.data()?.bannerURL)) {
      dataToSave.bannerURLOriginal = data.bannerURL;
    }

    // Set hasFluxSignature based on fluxSignature presence
    if (dataToSave.fluxSignature && Object.keys(dataToSave.fluxSignature).length > 0) {
      dataToSave.hasFluxSignature = true;
    } else if (dataToSave.hasOwnProperty('fluxSignature') && dataToSave.fluxSignature === null) {
      dataToSave.hasFluxSignature = false;
    }


    if (profileSnapshot.exists()) {
      console.info(`[saveUserProfile] Updating existing profile for userId: ${userId}`);
      const existingData = profileSnapshot.data() as UserProfileData;
      const potentiallyModeratedFields: (keyof UserProfileData)[] = ['bio', 'username', 'photoURL', 'bannerURL'];
      let needsModerationCheck = false;
      let changedFieldsForModeration: ('username' | 'bio' | 'photoURL' | 'bannerURL')[] = [];

      potentiallyModeratedFields.forEach(field => {
        if (dataToSave[field] !== undefined && dataToSave[field] !== existingData[field]) {
          needsModerationCheck = true;
          if (field === 'username' || field === 'bio' || field === 'photoURL' || field === 'bannerURL') {
            changedFieldsForModeration.push(field);
          }
        }
      });

      if (needsModerationCheck && changedFieldsForModeration.length > 0) {
        dataToSave.moderationStatus = 'pending';
        dataToSave.moderationInfo = { fields: changedFieldsForModeration, autoModerated: false, reason: 'Profile content updated.' };
        console.info(`[saveUserProfile] Profile fields (${changedFieldsForModeration.join(', ')}) for ${userId} changed, setting moderationStatus to pending.`);
      }

      await updateDoc(userProfileRef, {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      });
      console.info(`[saveUserProfile] Successfully updated profile for userId: ${userId}`);
    } else {
      console.info(`[saveUserProfile] Creating new profile for userId: ${userId}`);
      const newProfileData: UserProfileData = {
        uid: userId,
        email: data.email ?? null,
        fullName: data.fullName ?? '',
        username: data.username ?? '',
        bio: data.bio ?? '',
        photoURL: data.photoURL ?? null, 
        photoURLOriginal: data.photoURL ?? null, 
        bannerURL: data.bannerURL ?? null, 
        bannerURLOriginal: data.bannerURL ?? null, 
        isPremium: data.isPremium ?? false,
        premiumTier: data.premiumTier ?? "none",
        subscriptionId: data.subscriptionId ?? null,
        subscriptionStatus: data.subscriptionStatus ?? undefined,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        stripeCustomerId: data.stripeCustomerId ?? null,
        premiumSubscriptionId: data.premiumSubscriptionId ?? null,
        premiumSubscriptionEndsAt: data.premiumSubscriptionEndsAt ?? null,
        fluxSignature: data.fluxSignature ?? { dominantColors: [], keywords: [] },
        hasFluxSignature: !!(data.fluxSignature && Object.keys(data.fluxSignature).length > 0),
        fluxEvolutionPoints: data.fluxEvolutionPoints ?? [],
        followersCount: data.followersCount ?? 0,
        followingCount: data.followingCount ?? 0,
        isProfileAmplified: data.isProfileAmplified ?? false,
        profileAmplifiedAt: data.profileAmplifiedAt ?? null,
        emailOptIn: data.emailOptIn ?? false,
        themeSettings: data.themeSettings ?? { baseMode: 'system', customColors: { light: {}, dark: {} } },
        moderationStatus: 'pending',
        moderationInfo: null,
        ...dataToSave, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userProfileRef, newProfileData);
      console.info(`[saveUserProfile] Successfully created new profile for userId: ${userId}. Moderation status: pending.`);
    }
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[saveUserProfile] Error for userId: ${userId}: ${errorMessage}`, error);
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
      
      profile.fullName = profile.fullName ?? '';
      profile.username = profile.username ?? '';
      profile.bio = profile.bio ?? '';
      profile.fluxSignature = profile.fluxSignature ?? { dominantColors: [], keywords: [] };
      profile.hasFluxSignature = profile.hasFluxSignature ?? !!(profile.fluxSignature && Object.keys(profile.fluxSignature).length > 0);
      profile.fluxEvolutionPoints = profile.fluxEvolutionPoints ?? [];
      profile.photoURL = profile.photoURL ?? null;
      profile.photoURLOriginal = profile.photoURLOriginal ?? profile.photoURL ?? null; 
      profile.bannerURL = profile.bannerURL ?? null;
      profile.bannerURLOriginal = profile.bannerURLOriginal ?? profile.bannerURL ?? null; 
      profile.followersCount = profile.followersCount ?? 0;
      profile.followingCount = profile.followingCount ?? 0;
      profile.stripeCustomerId = profile.stripeCustomerId ?? null;
      profile.isPremium = profile.isPremium ?? false;
      profile.premiumTier = profile.premiumTier ?? "none";
      profile.subscriptionId = profile.subscriptionId ?? null;
      profile.subscriptionStatus = profile.subscriptionStatus ?? undefined;
      profile.currentPeriodEnd = profile.currentPeriodEnd ?? null;
      profile.premiumSubscriptionId = profile.premiumSubscriptionId ?? null;
      profile.premiumSubscriptionEndsAt = profile.premiumSubscriptionEndsAt ?? null;
      profile.emailOptIn = profile.emailOptIn ?? false;
      profile.isProfileAmplified = profile.isProfileAmplified ?? false;
      profile.profileAmplifiedAt = profile.profileAmplifiedAt ?? null;
      profile.themeSettings = profile.themeSettings ?? { baseMode: 'system', customColors: {light: {}, dark: {}} };
      profile.moderationStatus = profile.moderationStatus ?? 'approved';
      profile.moderationInfo = profile.moderationInfo ?? null;
      return profile;
    } else {
      console.warn(`[getUserProfile] No profile found for userId: ${userId}`);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getUserProfile] Error fetching profile for userId: ${userId}: ${errorMessage}`, error);
    return null;
  }
}
    
