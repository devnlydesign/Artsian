
'use server';

import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp, 
  doc, 
  getDoc,
  writeBatch,
  increment,
  deleteDoc
} from 'firebase/firestore';

export interface CommunityData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string; // Denormalized for easier display
  imageUrl?: string;
  dataAiHint?: string;
  memberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommunityMembershipData {
  id: string; // Typically userId_communityId or auto-generated
  userId: string;
  communityId: string;
  joinedAt: Timestamp;
  // role?: 'member' | 'admin' | 'moderator'; // For future expansion
}

// Firestore Security Rules Reminder for 'communities' and 'communityMemberships':
// match /communities/{communityId} {
//   allow read: if true; // Publicly readable
//   allow create: if request.auth != null; // Authenticated users can create
//   allow update: if request.auth != null && request.auth.uid == resource.data.creatorId; // Only creator can update
//   // delete: if needed
// }
// match /communityMemberships/{membershipId} {
//   allow read: if request.auth != null && (request.auth.uid == resource.data.userId || resource.data.communityId in get(/databases/$(database)/documents/communities/$(resource.data.communityId)).data.adminIds); // User can read their own, admins can read
//   allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//   allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
// }


export async function createCommunity(
  creatorId: string,
  creatorName: string,
  name: string,
  description: string,
  imageUrl: string = "https://placehold.co/400x200.png", // Default image
  dataAiHint: string = "community group" // Default hint
): Promise<{ success: boolean; communityId?: string; message?: string }> {
  if (!creatorId || !name || !description) {
    return { success: false, message: "Creator ID, name, and description are required." };
  }

  try {
    const communitiesCollectionRef = collection(db, 'communities');
    const docRef = await addDoc(communitiesCollectionRef, {
      name,
      description,
      creatorId,
      creatorName,
      imageUrl,
      dataAiHint,
      memberCount: 1, // Creator is the first member
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Automatically add creator to the communityMemberships
    const membershipRef = doc(db, 'communityMemberships', `${creatorId}_${docRef.id}`);
    await setDoc(membershipRef, {
      userId: creatorId,
      communityId: docRef.id,
      joinedAt: serverTimestamp(),
      role: 'admin', // Creator is admin
    });

    return { success: true, communityId: docRef.id };
  } catch (error) {
    console.error("Error creating community: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create community: ${errorMessage}` };
  }
}

export async function getAllPublicCommunities(): Promise<CommunityData[]> {
  try {
    const communitiesCollectionRef = collection(db, 'communities');
    const q = query(communitiesCollectionRef, orderBy("createdAt", "desc")); // Order by creation date or memberCount
    const querySnapshot = await getDocs(q);
    
    const communities: CommunityData[] = [];
    querySnapshot.forEach((doc) => {
      communities.push({ id: doc.id, ...doc.data() } as CommunityData);
    });
    return communities;
  } catch (error) {
    console.error("Error fetching all public communities: ", error);
    return [];
  }
}

export async function getCommunityById(communityId: string): Promise<CommunityData | null> {
  if (!communityId) return null;
  try {
    const communityDocRef = doc(db, 'communities', communityId);
    const docSnap = await getDoc(communityDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CommunityData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching community by ID:", error);
    return null;
  }
}


export async function joinCommunity(
  userId: string,
  communityId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !communityId) {
    return { success: false, message: "User ID and Community ID are required." };
  }

  try {
    const batch = writeBatch(db);
    const membershipId = `${userId}_${communityId}`;
    const membershipDocRef = doc(db, 'communityMemberships', membershipId);
    
    // Check if membership already exists to prevent errors or duplicate increments
    const membershipSnap = await getDoc(membershipDocRef);
    if (membershipSnap.exists()) {
      return { success: false, message: "User is already a member of this community." };
    }

    batch.set(membershipDocRef, {
      userId,
      communityId,
      joinedAt: serverTimestamp(),
      role: 'member',
    });

    const communityDocRef = doc(db, 'communities', communityId);
    batch.update(communityDocRef, {
      memberCount: increment(1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error joining community: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to join community: ${errorMessage}` };
  }
}

export async function leaveCommunity(
  userId: string,
  communityId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !communityId) {
    return { success: false, message: "User ID and Community ID are required." };
  }

  try {
    const batch = writeBatch(db);
    const membershipId = `${userId}_${communityId}`;
    const membershipDocRef = doc(db, 'communityMemberships', membershipId);
    
    const membershipSnap = await getDoc(membershipDocRef);
    if (!membershipSnap.exists()) {
      return { success: false, message: "User is not a member of this community." };
    }

    batch.delete(membershipDocRef);

    const communityDocRef = doc(db, 'communities', communityId);
    batch.update(communityDocRef, {
      memberCount: increment(-1),
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error leaving community: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to leave community: ${errorMessage}` };
  }
}

export async function getUserCommunityMemberships(userId: string): Promise<CommunityMembershipData[]> {
  if (!userId) return [];
  try {
    const membershipsCollectionRef = collection(db, 'communityMemberships');
    const q = query(membershipsCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const memberships: CommunityMembershipData[] = [];
    querySnapshot.forEach((doc) => {
      memberships.push({ id: doc.id, ...doc.data() } as CommunityMembershipData);
    });
    return memberships;
  } catch (error) {
    console.error("Error fetching user community memberships:", error);
    return [];
  }
}

// Helper function to set doc with merge for serverTimestamp, used internally
async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  const { serverTimestamp } = await import('firebase/firestore'); // Local import to avoid top-level await issues if any
  // Ensure timestamps are handled correctly
  const dataWithTimestamps = Object.keys(data).reduce((acc, key) => {
    if (data[key] === serverTimestamp()) {
      acc[key] = serverTimestamp();
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {} as any);

  const firestoreSetDoc = (await import('firebase/firestore')).setDoc;
  return firestoreSetDoc(docRef, dataWithTimestamps, options);
}

    