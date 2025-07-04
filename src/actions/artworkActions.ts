
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
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
  imageUrlOriginal?: string; 
  dataAiHint: string;
  layers?: LayerData[];
  tags?: string[];
  isPublished?: boolean;
  scheduledPublishTime?: Timestamp | null;
  status?: 'draft' | 'scheduled' | 'published' | 'pending_moderation';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isAmplified?: boolean;
  amplifiedAt?: Timestamp | null;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
  };
}


export async function createArtwork(
  userId: string,
  artworkDetails: Omit<ArtworkData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPublished' | 'status' | 'isAmplified' | 'amplifiedAt' | 'moderationStatus' | 'moderationInfo' | 'imageUrlOriginal'> & { isPublished?: boolean; scheduledPublishTime?: Timestamp | null; imageUrlOriginal?: string; layers?: LayerData[]; tags?: string[] }
): Promise<{ success: boolean; artworkId?: string; message?: string }> {
  if (!userId) {
    const msg = '[createArtwork] Missing userId.';
    console.warn(msg);
    return { success: false, message: "User ID is required to create an artwork." };
  }
  if (!artworkDetails.title || !artworkDetails.imageUrl || !artworkDetails.type || !artworkDetails.description) {
    const msg = `[createArtwork] Missing required details for userId: ${userId}, title: ${artworkDetails.title}`;
    console.warn(msg);
    return { success: false, message: "Missing required artwork details (title, image URL, type, description)." };
  }
  console.info(`[createArtwork] Attempting for userId: ${userId}, title: ${artworkDetails.title}, schedule: ${artworkDetails.scheduledPublishTime}`);

  try {
    const artworksCollectionRef = collection(db, 'artworks');
    
    let currentStatus: ArtworkData['status'] = 'pending_moderation';
    let published = false;

    if (artworkDetails.scheduledPublishTime && artworkDetails.scheduledPublishTime.toDate() > new Date()) {
      currentStatus = 'scheduled';
      published = false;
      console.info(`[createArtwork] Artwork "${artworkDetails.title}" is scheduled for publishing at ${artworkDetails.scheduledPublishTime.toDate().toISOString()}`);
    } else if (artworkDetails.isPublished === true && (!artworkDetails.scheduledPublishTime || artworkDetails.scheduledPublishTime.toDate() <= new Date())) {
      currentStatus = 'pending_moderation'; 
      published = false; 
      console.info(`[createArtwork] Artwork "${artworkDetails.title}" marked for publishing, will go to moderation first.`);
    } else {
      currentStatus = 'draft'; 
      published = false;
      console.info(`[createArtwork] Artwork "${artworkDetails.title}" saved as draft.`);
    }
    
    if (currentStatus !== 'draft') {
        currentStatus = 'pending_moderation';
    }


    const docRef = await addDoc(artworksCollectionRef, {
      ...artworkDetails,
      userId: userId,
      layers: artworkDetails.layers || [],
      tags: artworkDetails.tags || [],
      isPublished: published, 
      status: currentStatus,
      scheduledPublishTime: artworkDetails.scheduledPublishTime || null,
      imageUrlOriginal: artworkDetails.imageUrlOriginal || artworkDetails.imageUrl, 
      isAmplified: false,
      amplifiedAt: null,
      moderationStatus: 'pending', 
      moderationInfo: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createArtwork] Successfully created artworkId: ${docRef.id} for userId: ${userId} with status: ${currentStatus}. Moderation status: pending.`);
    return { success: true, artworkId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createArtwork] Error for userId: ${userId}, title: ${artworkDetails.title}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create artwork: ${errorMessage}` };
  }
}

export async function getArtworksByUserId(userId: string, requesterId?: string | null): Promise<ArtworkData[]> {
  if (!userId) {
    // console.warn('[getArtworksByUserId] Missing userId.'); // Can be noisy
    return [];
  }
  // console.info(`[getArtworksByUserId] Fetching for userId: ${userId}, requesterId: ${requesterId}`);

  try {
    const artworksCollectionRef = collection(db, 'artworks');
    let qConstraints = [where("userId", "==", userId), orderBy("createdAt", "desc")];

    // If a requesterId is provided and it's different from the userId,
    // or if no requesterId is provided (unauthenticated view), then filter for public/approved.
    const isPublicView = !requesterId || requesterId !== userId;
    if (isPublicView) {
      qConstraints.unshift(where("isPublished", "==", true)); // unshift to add to beginning for better index usage potentially
      qConstraints.unshift(where("moderationStatus", "==", "approved"));
    }
    
    const q = query(artworksCollectionRef, ...qConstraints);
    const querySnapshot = await getDocs(q);

    const artworks: ArtworkData[] = [];
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        if (data && data.title && data.type && data.description && data.imageUrl) {
            artworks.push({
              id: doc.id,
              ...data,
              layers: Array.isArray(data.layers) ? data.layers : [], 
              imageUrlOriginal: data.imageUrlOriginal || data.imageUrl, 
              isPublished: data.isPublished ?? (data.status === 'published'),
              status: data.status ?? 'draft',
              scheduledPublishTime: data.scheduledPublishTime ?? null,
              isAmplified: data.isAmplified ?? false,
              amplifiedAt: data.amplifiedAt ?? null,
              moderationStatus: data.moderationStatus ?? 'approved',
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

export async function getArtworkById(artworkId: string, requesterId?: string | null): Promise<ArtworkData | null> {
  if (!artworkId) {
    // console.warn('[getArtworkById] Missing artworkId.');
    return null;
  }
  // console.info(`[getArtworkById] Fetching artworkId: ${artworkId}, requesterId: ${requesterId}`);

  try {
    const artworkDocRef = doc(db, 'artworks', artworkId);
    const docSnap = await getDoc(artworkDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const isOwner = requesterId === data.userId;
      const isPublicAndApproved = data.isPublished === true && data.moderationStatus === 'approved';

      if (isOwner || isPublicAndApproved) {
        const layers = Array.isArray(data.layers) ? data.layers : [];
        // console.info(`[getArtworkById] Found artworkId: ${artworkId}`);
        return {
          id: docSnap.id,
          ...data,
          layers,
          imageUrlOriginal: data.imageUrlOriginal || data.imageUrl, 
          isPublished: data.isPublished ?? (data.status === 'published'),
          status: data.status ?? 'draft',
          scheduledPublishTime: data.scheduledPublishTime ?? null,
          isAmplified: data.isAmplified ?? false,
          amplifiedAt: data.amplifiedAt ?? null,
          moderationStatus: data.moderationStatus ?? 'approved',
          moderationInfo: data.moderationInfo ?? null,
        } as ArtworkData;
      } else {
        console.warn(`[getArtworkById] Access denied or artwork not public/approved for artworkId: ${artworkId}. Owner: ${isOwner}, Public: ${isPublicAndApproved}`);
        return null;
      }
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

export async function updateArtworkStatus(
  artworkId: string,
  newStatus: ArtworkData['status'],
  isPublishedUpdate?: boolean
): Promise<{ success: boolean; message?: string }> {
  if (!artworkId) {
    const msg = '[updateArtworkStatus] Artwork ID is required.';
    console.warn(msg);
    return { success: false, message: msg };
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
    
    await updateDoc(artworkRef, updateData);
    console.info(`[updateArtworkStatus] Successfully updated artwork ${artworkId} status to ${newStatus}.`);
    return { success: true, message: `Artwork ${artworkId} status updated to ${newStatus}.` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[updateArtworkStatus] Error updating artwork ${artworkId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to update artwork status: ${errorMessage}` };
  }
}

    
