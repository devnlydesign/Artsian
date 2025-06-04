
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from './userProfile';

export interface LayerData {
  id: string;
  type: "text" | "image" | "video" | "audio";
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  dataAiHint?: string;
  order: number;
}

export interface ArtworkData {
  id: string;
  userId: string;
  title: string;
  type: "Artwork" | "Process Chronicle" | "Sketch" | "Multimedia" | "Other";
  description: string;
  imageUrl: string;
  dataAiHint: string;
  layers?: LayerData[];
  tags?: string[];
  isPublished?: boolean; // True if status is 'published'
  scheduledPublishTime?: Timestamp | null; // Time for the item to go live
  status?: 'draft' | 'scheduled' | 'published' | 'pending_moderation'; // Workflow status
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isAmplified?: boolean;
  amplifiedAt?: Timestamp | null;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated'; // Primary moderation field
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
  };
}


export async function createArtwork(
  userId: string,
  artworkDetails: Omit<ArtworkData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPublished' | 'status' | 'isAmplified' | 'amplifiedAt' | 'moderationStatus' | 'moderationInfo'> & { isPublished?: boolean; scheduledPublishTime?: Timestamp | null }
): Promise<{ success: boolean; artworkId?: string; message?: string }> {
  if (!userId) {
    console.warn('[createArtwork] Missing userId.');
    return { success: false, message: "User ID is required to create an artwork." };
  }
  if (!artworkDetails.title || !artworkDetails.imageUrl || !artworkDetails.type || !artworkDetails.description) {
    console.warn(`[createArtwork] Missing required details for userId: ${userId}, title: ${artworkDetails.title}`);
    return { success: false, message: "Missing required artwork details (title, image URL, type, description)." };
  }
  console.info(`[createArtwork] Attempting for userId: ${userId}, title: ${artworkDetails.title}, schedule: ${artworkDetails.scheduledPublishTime}`);

  try {
    const artworksCollectionRef = collection(db, 'artworks');
    
    let currentStatus: ArtworkData['status'] = 'pending_moderation'; // Default to pending moderation
    let published = false;

    if (artworkDetails.scheduledPublishTime && artworkDetails.scheduledPublishTime.toDate() > new Date()) {
      currentStatus = 'scheduled';
      published = false; // Will be set to true by the scheduled function
      console.info(`[createArtwork] Artwork "${artworkDetails.title}" is scheduled for publishing at ${artworkDetails.scheduledPublishTime.toDate().toISOString()}`);
    } else {
      // If not scheduled, or scheduled for the past, it goes into normal flow (e.g. pending moderation)
      // published = artworkDetails.isPublished ?? false; // If not scheduling, isPublished flag from input could be used or default to false due to moderation
      // For now, new non-scheduled items go to pending_moderation and are not published yet.
      published = false;
      currentStatus = 'pending_moderation';
      console.info(`[createArtwork] Artwork "${artworkDetails.title}" to be processed for moderation before publishing.`);
    }

    const docRef = await addDoc(artworksCollectionRef, {
      ...artworkDetails,
      userId: userId,
      layers: artworkDetails.layers || [],
      isPublished: published,
      status: currentStatus,
      scheduledPublishTime: artworkDetails.scheduledPublishTime || null,
      isAmplified: false,
      amplifiedAt: null,
      moderationStatus: 'pending', // All new content starts as pending general moderation
      moderationInfo: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createArtwork] Successfully created artworkId: ${docRef.id} for userId: ${userId} with status: ${currentStatus}. Moderation status: pending.`);
    // TODO: Trigger content moderation Cloud Function here for the new artwork (docRef.id)
    // This function would analyze artworkDetails.description, artworkDetails.title, and artworkDetails.imageUrl
    return { success: true, artworkId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createArtwork] Error for userId: ${userId}, title: ${artworkDetails.title}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create artwork: ${errorMessage}` };
  }
}

export async function getArtworksByUserId(userId: string): Promise<ArtworkData[]> {
  if (!userId) {
    console.warn('[getArtworksByUserId] Missing userId.');
    return [];
  }
  // console.info(`[getArtworksByUserId] Fetching for userId: ${userId}`);

  try {
    const artworksCollectionRef = collection(db, 'artworks');
    // PERFORMANCE & SCALABILITY:
    // 1. Ensure composite index on (userId, createdAt) and (userId, status, createdAt) if not automatically created.
    // 2. For production, implement pagination (e.g., using limit() and startAfter()).
    // 3. CONTENT MODERATION: Add where("moderationStatus", "==", "approved") and where("status", "==", "published") if only approved & published content should be shown.
    const q = query(artworksCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const artworks: ArtworkData[] = [];
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        if (data && data.title && data.type && data.description && data.imageUrl) {
            artworks.push({
              id: doc.id,
              ...data,
              isPublished: data.isPublished ?? (data.status === 'published'),
              status: data.status ?? 'draft',
              scheduledPublishTime: data.scheduledPublishTime ?? null,
              isAmplified: data.isAmplified ?? false,
              amplifiedAt: data.amplifiedAt ?? null,
              moderationStatus: data.moderationStatus ?? 'approved', // Default to approved if not set for display
              moderationInfo: data.moderationInfo ?? null,
            } as ArtworkData);
        } else {
            console.warn(`[getArtworksByUserId] Skipping malformed artwork document with id: ${doc.id} for userId: ${userId}`);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error processing document.";
        console.error(`[getArtworksByUserId] Error processing artwork document ${doc.id} for userId: ${userId}: ${errorMessage}`, e);
      }
    });
    // console.info(`[getArtworksByUserId] Found ${artworks.length} artworks for userId: ${userId}`);
    return artworks;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getArtworksByUserId] Error fetching artworks for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}

export async function getArtworkById(artworkId: string): Promise<ArtworkData | null> {
  if (!artworkId) {
    console.warn('[getArtworkById] Missing artworkId.');
    return null;
  }
  // console.info(`[getArtworkById] Fetching artworkId: ${artworkId}`);

  try {
    const artworkDocRef = doc(db, 'artworks', artworkId);
    const docSnap = await getDoc(artworkDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // CONTENT MODERATION: Consider if unapproved content should be directly accessible by ID.
      // if (data.moderationStatus !== 'approved' && data.status !== 'published') return null; // Or handle differently based on roles
      const layers = Array.isArray(data.layers) ? data.layers : [];
      // console.info(`[getArtworkById] Found artworkId: ${artworkId}`);
      return {
        id: docSnap.id,
        ...data,
        layers,
        isPublished: data.isPublished ?? (data.status === 'published'),
        status: data.status ?? 'draft',
        scheduledPublishTime: data.scheduledPublishTime ?? null,
        isAmplified: data.isAmplified ?? false,
        amplifiedAt: data.amplifiedAt ?? null,
        moderationStatus: data.moderationStatus ?? 'approved',
        moderationInfo: data.moderationInfo ?? null,
      } as ArtworkData;
    } else {
      console.warn(`[getArtworkById] No artwork found with artworkId: ${artworkId}`);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getArtworkById] Error fetching artworkId: ${artworkId}: ${errorMessage}`, error);
    return null;
  }
}

// Action to update artwork status, e.g., by an admin or scheduled function
export async function updateArtworkStatus(
  artworkId: string,
  newStatus: ArtworkData['status'],
  isPublishedUpdate?: boolean
): Promise<{ success: boolean; message?: string }> {
  if (!artworkId) {
    return { success: false, message: 'Artwork ID is required.' };
  }
  console.info(`[updateArtworkStatus] Updating artwork ${artworkId} to status ${newStatus}`);
  try {
    const artworkRef = doc(db, 'artworks', artworkId);
    const updateData: Partial<ArtworkData> = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };
    if (typeof isPublishedUpdate === 'boolean') {
      updateData.isPublished = isPublishedUpdate;
    } else if (newStatus === 'published') {
        updateData.isPublished = true;
    }


    // If moving to published, and moderation is a concern, ensure it's approved.
    // This logic might be more complex depending on your full workflow.
    // For example, the scheduled function might publish directly, or set to 'pending_moderation' if it hasn't been moderated yet.
    // For now, this action assumes the newStatus is the definitive state.
    
    if (newStatus === 'published') {
      // Optionally, clear scheduledPublishTime if it's now published
      // updateData.scheduledPublishTime = null; // Or keep for history
    }

    await updateDoc(artworkRef, updateData);
    return { success: true, message: `Artwork ${artworkId} status updated to ${newStatus}.` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[updateArtworkStatus] Error updating artwork ${artworkId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to update artwork status: ${errorMessage}` };
  }
}
