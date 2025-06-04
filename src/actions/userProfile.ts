
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';

// Matches the new "users" collection schema from the prompt
export interface UserProfileData {
  uid: string; // From Firebase Auth
  username?: string; // Unique
  email?: string | null; // From Firebase Auth
  profileImageUrl?: string | null; // URL to Firebase Storage
  photoURL?: string | null; // Retaining for compatibility with AppStateContext, can be same as profileImageUrl
  photoURLOriginal?: string | null;
  bannerURL?: string | null;
  bannerURLOriginal?: string | null;
  bio?: string;
  createdAt?: Timestamp;
  followersCount?: number; // Initial: 0
  followingCount?: number; // Initial: 0
  lastSeen?: Timestamp;
  postsCount?: number; // Initial: 0
  storiesCount?: number; // Initial: 0
  // --- Existing fields from ARTISAN PRD ---
  fullName?: string; // Can be derived or explicitly set
  genre?: string; // Artist-specific
  style?: string; // Artist-specific
  motivations?: string; // Artist-specific
  inspirations?: string; // Artist-specific
  website?: string; // Artist-specific
  socialMedia?: string; // Artist-specific
  location?: string; // Artist-specific
  portfolioLink?: string; // Artist-specific
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
  hasFluxSignature?: boolean;
  fluxEvolutionPoints?: FluxEvolutionPoint[];
  isProfileAmplified?: boolean;
  profileAmplifiedAt?: Timestamp | null;
  themeSettings?: UserProfileThemeSettings;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
    fields?: ('username' | 'bio' | 'profileImageUrl' | 'bannerURL')[];
  };
}

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
    
    if (data.profileImageUrl && (!profileSnapshot.exists() || data.profileImageUrl !== profileSnapshot.data()?.profileImageUrl)) {
      dataToSave.photoURL = data.profileImageUrl; // Ensure photoURL (used by AppStateContext) is also updated
      dataToSave.photoURLOriginal = data.profileImageUrl;
    } else if (data.photoURL && (!profileSnapshot.exists() || data.photoURL !== profileSnapshot.data()?.photoURL)) {
        // If only photoURL is provided (e.g. from Google Sign-in), use it for profileImageUrl as well
        dataToSave.profileImageUrl = data.photoURL;
        dataToSave.photoURLOriginal = data.photoURL;
    }


    if (data.bannerURL && (!profileSnapshot.exists() || data.bannerURL !== profileSnapshot.data()?.bannerURL)) {
      dataToSave.bannerURLOriginal = data.bannerURL;
    }


    if (dataToSave.fluxSignature && Object.keys(dataToSave.fluxSignature).length > 0) {
      dataToSave.hasFluxSignature = true;
    } else if (dataToSave.hasOwnProperty('fluxSignature') && dataToSave.fluxSignature === null) {
      dataToSave.hasFluxSignature = false;
    }

    const now = serverTimestamp();

    if (profileSnapshot.exists()) {
      console.info(`[saveUserProfile] Updating existing profile for userId: ${userId}`);
      const existingData = profileSnapshot.data() as UserProfileData;
      const potentiallyModeratedFields: (keyof UserProfileData)[] = ['bio', 'username', 'profileImageUrl', 'bannerURL', 'fullName'];
      let needsModerationCheck = false;
      let changedFieldsForModeration: ('username' | 'bio' | 'profileImageUrl' | 'bannerURL')[] = [];

      potentiallyModeratedFields.forEach(field => {
        if (dataToSave[field] !== undefined && dataToSave[field] !== existingData[field]) {
          needsModerationCheck = true;
           if (field === 'username' || field === 'bio' || field === 'profileImageUrl' || field === 'bannerURL') {
            changedFieldsForModeration.push(field);
          }
        }
      });

      if (needsModerationCheck && changedFieldsForModeration.length > 0 && existingData.moderationStatus !== 'pending') {
        dataToSave.moderationStatus = 'pending';
        dataToSave.moderationInfo = { fields: changedFieldsForModeration, autoModerated: false, reason: 'Profile content updated.' };
        console.info(`[saveUserProfile] Profile fields (${changedFieldsForModeration.join(', ')}) for ${userId} changed, setting moderationStatus to pending.`);
      }
      
      dataToSave.lastSeen = now;
      await updateDoc(userProfileRef, {
        ...dataToSave,
        updatedAt: now, 
      });
      console.info(`[saveUserProfile] Successfully updated profile for userId: ${userId}`);
    } else {
      console.info(`[saveUserProfile] Creating new profile for userId: ${userId}`);
      const newProfileData: UserProfileData = {
        uid: userId,
        email: data.email ?? null,
        username: data.username || data.email?.split('@')[0] || `user_${userId.substring(0,6)}`,
        profileImageUrl: data.profileImageUrl ?? data.photoURL ?? null,
        photoURL: data.photoURL ?? data.profileImageUrl ?? null, 
        photoURLOriginal: data.photoURLOriginal ?? data.profileImageUrl ?? data.photoURL ?? null,
        bannerURL: data.bannerURL ?? null,
        bannerURLOriginal: data.bannerURLOriginal ?? data.bannerURL ?? null,
        bio: data.bio ?? '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        storiesCount: 0,
        isPremium: data.isPremium ?? false,
        premiumTier: data.premiumTier ?? "none",
        fluxSignature: data.fluxSignature ?? { dominantColors: [], keywords: [] },
        hasFluxSignature: !!(data.fluxSignature && Object.keys(data.fluxSignature).length > 0),
        fluxEvolutionPoints: data.fluxEvolutionPoints ?? [],
        emailOptIn: data.emailOptIn ?? false,
        themeSettings: data.themeSettings ?? { baseMode: 'system', customColors: { light: {}, dark: {} } },
        moderationStatus: 'pending', 
        moderationInfo: { reason: 'New profile creation.' }, // Indicate new profile for moderation context
        ...dataToSave, 
        createdAt: now,
        updatedAt: now, // Add updatedAt on creation as well
        lastSeen: now,
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
      
      // Ensure all fields have default values if not present
      profile.username = profile.username ?? '';
      profile.email = profile.email ?? null;
      profile.profileImageUrl = profile.profileImageUrl ?? profile.photoURL ?? null;
      profile.photoURL = profile.photoURL ?? profile.profileImageUrl ?? null; 
      profile.photoURLOriginal = profile.photoURLOriginal ?? profile.profileImageUrl ?? profile.photoURL ?? null;
      profile.bannerURL = profile.bannerURL ?? null;
      profile.bannerURLOriginal = profile.bannerURLOriginal ?? profile.bannerURL ?? null;
      profile.bio = profile.bio ?? '';
      profile.followersCount = profile.followersCount ?? 0;
      profile.followingCount = profile.followingCount ?? 0;
      profile.postsCount = profile.postsCount ?? 0;
      profile.storiesCount = profile.storiesCount ?? 0;
      profile.fullName = profile.fullName ?? '';
      profile.fluxSignature = profile.fluxSignature ?? { dominantColors: [], keywords: [] };
      profile.hasFluxSignature = profile.hasFluxSignature ?? !!(profile.fluxSignature && Object.keys(profile.fluxSignature).length > 0);
      profile.fluxEvolutionPoints = profile.fluxEvolutionPoints ?? [];
      profile.isPremium = profile.isPremium ?? false;
      profile.premiumTier = profile.premiumTier ?? "none";
      profile.emailOptIn = profile.emailOptIn ?? false;
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
    
    
