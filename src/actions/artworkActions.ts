
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from './userProfile'; // Assuming UserProfileData might be linked or referenced

export interface ArtworkData {
  id: string;
  userId: string; // Firebase UID of the creator
  title: string;
  type: "Artwork" | "Process Chronicle" | "Sketch" | "Multimedia" | "Other";
  description: string;
  imageUrl: string; // URL to the main image of the artwork
  dataAiHint: string; // For Unsplash/AI image search hints for placeholders
  fullContentUrl?: string; // Optional: URL for high-fidelity view or other media
  details?: string; // Optional: More detailed description or content
  tags?: string[]; // Optional: User-defined tags
  isPublished?: boolean; // Optional: For draft/published status
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Firestore Security Rules Reminder:
// Ensure your Firestore rules allow authenticated users to create artworks
// and read artworks (potentially based on isPublished status or userId).
// Example for 'artworks' collection:
// match /artworks/{artworkId} {
//   allow read: if true; // Or more restrictive, e.g., if resource.data.isPublished == true || request.auth.uid == resource.data.userId;
//   allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//   allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
// }

export async function createArtwork(
  userId: string,
  artworkDetails: Omit<ArtworkData, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPublished'> & { isPublished?: boolean }
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
      isPublished: artworkDetails.isPublished ?? true, // Default to published
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
      artworks.push({ id: doc.id, ...doc.data() } as ArtworkData);
    });
    return artworks;
  } catch (error) {
    console.error("Error fetching artworks by user ID: ", error);
    return [];
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
      return { id: docSnap.id, ...docSnap.data() } as ArtworkData;
    } else {
      console.log("No such artwork found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching artwork by ID: ", error);
    return null;
  }
}
