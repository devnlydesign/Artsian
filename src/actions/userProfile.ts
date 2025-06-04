
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
  bannerURL?: string | null;
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
  stripeCustomerId?: string | null;
  premiumSubscriptionId?: string | null;
  premiumSubscriptionEndsAt?: Timestamp | null;
  fluxSignature?: FluxSignature;
  fluxEvolutionPoints?: FluxEvolutionPoint[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  followersCount?: number;
  followingCount?: number;
  isProfileAmplified?: boolean;
  profileAmplifiedAt?: Timestamp | null;
  themeSettings?: UserProfileThemeSettings;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated'; // For username, bio, photoURL, bannerURL
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
    fields?: ('username' | 'bio' | 'photoURL' | 'bannerURL')[]; // To track which fields were moderated
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

    // Remove undefined fields to prevent Firestore errors or unintentional field deletions
    Object.keys(dataToSave).forEach(key => {
      const K = key as keyof UserProfileData;
      if (dataToSave[K] === undefined) {
        delete dataToSave[K];
      }
    });

    if (profileSnapshot.exists()) {
      // When updating, check if sensitive fields (bio, username, photoURL, bannerURL) are changing
      const existingData = profileSnapshot.data() as UserProfileData;
      const potentiallyModeratedFields: (keyof UserProfileData)[] = ['bio', 'username', 'photoURL', 'bannerURL'];
      let needsModerationCheck = false;
      potentiallyModeratedFields.forEach(field => {
        if (dataToSave[field] !== undefined && dataToSave[field] !== existingData[field]) {
          needsModerationCheck = true;
        }
      });

      if (needsModerationCheck) {
        dataToSave.moderationStatus = 'pending';
        // TODO: Trigger content moderation Cloud Function here for user profile fields
        // e.g., pass dataToSave.bio, dataToSave.username, new photoURL/bannerURL if changed.
        console.info(`[saveUserProfile] Profile fields for ${userId} changed, setting moderationStatus to pending.`);
      }

      await updateDoc(userProfileRef, {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      });
      console.info(`[saveUserProfile] Successfully updated profile for userId: ${userId}`);
    } else {
      console.info(`[saveUserProfile] Creating new profile for userId: ${userId}`);
      await setDoc(userProfileRef, {
        uid: userId,
        email: data.email ?? null,
        fullName: data.fullName ?? '',
        username: data.username ?? '',
        bio: data.bio ?? '',
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
        themeSettings: data.themeSettings ?? { baseMode: 'system', customColors: { light: {}, dark: {} } },
        moderationStatus: 'pending', // New profiles also start as pending
        moderationInfo: null,
        ...dataToSave, // Spread again to ensure incoming data overrides defaults if present
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // TODO: Trigger content moderation Cloud Function here for new user profile fields
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
    // console.warn('[getUserProfile] Missing userId.');
    return null;
  }
  // console.info(`[getUserProfile] Fetching profile for userId: ${userId}`);
  try {
    const userProfileRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfileData;
      // CONTENT MODERATION: Consider if unapproved profiles should be fully hidden or partially.
      // If profile.moderationStatus === 'rejected', you might return null or a redacted version.
      
      // Ensure all potentially undefined fields have sensible defaults
      profile.fullName = profile.fullName ?? '';
      profile.username = profile.username ?? '';
      profile.bio = profile.bio ?? '';
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
      profile.themeSettings = profile.themeSettings ?? { baseMode: 'system', customColors: {light: {}, dark: {}} };
      profile.moderationStatus = profile.moderationStatus ?? 'approved'; // Default to approved if not set
      profile.moderationInfo = profile.moderationInfo ?? null;
      // console.info(`[getUserProfile] Profile found for userId: ${userId}`);
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
