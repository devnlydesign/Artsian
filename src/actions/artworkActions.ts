
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from './userProfile'; // Assuming UserProfileData might be linked or referenced

export interface LayerData {
  id: string; // Unique identifier for the layer (e.g., UUID)
  type: "text" | "image" | "video" | "audio";
  title?: string;
  description?: string;
  content?: string; // For text type
  url?: string;     // For image, video, audio types (Firebase Storage URL)
  dataAiHint?: string; // For image/video layers
  order: number;    // Display order of the layer
}

export interface ArtworkData {
  id: string;
  userId: string; // Firebase UID of the creator
  title: string;
  type: "Artwork" | "Process Chronicle" | "Sketch" | "Multimedia" | "Other";
  description: string; // General description of the artwork
  imageUrl: string; // URL to the main COVER image/thumbnail of the artwork
  dataAiHint: string; // For Unsplash/AI image search hints for the cover image
  layers?: LayerData[]; // Array of content layers
  tags?: string[]; // Optional: User-defined tags
  isPublished?: boolean; // Optional: For draft/published status
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isAmplified?: boolean; // For Amplify Flux Pulse feature
  amplifiedAt?: Timestamp | null; // Timestamp of when it was last amplified
}

// Firestore Security Rules Reminder:
// Ensure your Firestore rules allow authenticated users to create artworks
// and read artworks (potentially based on isPublished status or userId).
// Example for 'artworks' collection:
// match /artworks/{artworkId} {
//   allow read: if true; // Or more restrictive, e.g., if resource.data.isPublished == true || request.auth.uid == resource.data.userId;
//   allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//   allow update: if request.auth != null && request.auth.uid == resource.data.userId; // Ensure rules allow updating isAmplified by owner
//   allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
// }

export async function createArtwork(
  userId: string,
  artworkDetails: Omit<ArtworkData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPublished' | 'isAmplified' | 'amplifiedAt'> & { isPublished?: boolean }
): Promise<{ success: boolean; artworkId?: string; message?: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required to create an artwork." };
  }
  if (!artworkDetails.title || !artworkDetails.imageUrl || !artworkDetails.type || !artworkDetails.description) {
    return { success: false, message: "Missing required artwork details (title, image URL, type, description)." };
  }

  try {
    const artworksCollectionRef = collection(db, 'artworks');
    const docRef = await addDoc(artworksCollectionRef, {
      ...artworkDetails,
      userId: userId,
      layers: artworkDetails.layers || [], // Ensure layers is at least an empty array
      isPublished: artworkDetails.isPublished ?? true, // Default to published
      isAmplified: false,
      amplifiedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, artworkId: docRef.id };
  } catch (error) {
    console.error("Error creating artwork: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create artwork: ${errorMessage}` };
  }
}

export async function getArtworksByUserId(userId: string): Promise<ArtworkData[]> {
  if (!userId) {
    return [];
  }
  try {
    const artworksCollectionRef = collection(db, 'artworks');
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
              isAmplified: data.isAmplified ?? false,
              amplifiedAt: data.amplifiedAt ?? null,
            } as ArtworkData);
        } else {
            console.warn(`Skipping malformed artwork document with id: ${doc.id}`);
        }
      } catch (e) {
        console.error(`Error processing artwork document ${doc.id}:`, e);
      }
    });
    return artworks;
  } catch (error) {
    console.error("Error fetching artworks by user ID: ", error);
    return []; // Return empty array on error to prevent breaking caller
  }
}

export async function getArtworkById(artworkId: string): Promise<ArtworkData | null> {
  if (!artworkId) {
    return null;
  }
  try {
    const artworkDocRef = doc(db, 'artworks', artworkId);
    const docSnap = await getDoc(artworkDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const layers = Array.isArray(data.layers) ? data.layers : [];
      return { 
        id: docSnap.id, 
        ...data, 
        layers,
        isAmplified: data.isAmplified ?? false,
        amplifiedAt: data.amplifiedAt ?? null,
      } as ArtworkData;
    } else {
      console.log("No such artwork found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching artwork by ID: ", error);
    return null;
  }
}
