
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
  deleteDoc,
  orderBy,
  runTransaction
} from 'firebase/firestore';

export interface CommunityData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string; 
  imageUrl?: string;
  dataAiHint?: string;
  memberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommunityMembershipData {
  id: string; 
  userId: string;
  communityId: string;
  joinedAt: Timestamp;
  role?: 'member' | 'admin' | 'moderator'; 
}

export interface CommunityPostData {
  id: string;
  communityId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl?: string | null;
  content: string;
  imageUrl?: string; 
  dataAiHintImageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Future expansions:
  // likesCount: number;
  // commentsCount: number;
}


// Firestore Security Rules Reminder for 'communities' and 'communityMemberships':
// match /communities/{communityId} {
//   allow read: if true; 
//   allow create: if request.auth != null; 
//   allow update: if request.auth != null && request.auth.uid == resource.data.creatorId; 
// }
// match /communityMemberships/{membershipId} {
//   allow read: if request.auth != null && (request.auth.uid == resource.data.userId || resource.data.communityId in get(/databases/$(database)/documents/communities/$(resource.data.communityId)).data.adminIds); 
//   allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//   allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
// }
// match /communities/{communityId}/posts/{postId} {
//   allow read: if true; // Assuming public communities for now
//   allow create: if request.auth != null && request.auth.uid == request.resource.data.creatorId &&
//                 exists(/databases/$(database)/documents/communityMemberships/$(request.auth.uid + '_' + communityId)); 
//   allow update: if request.auth != null && request.auth.uid == resource.data.creatorId;
//   allow delete: if request.auth != null && request.auth.uid == resource.data.creatorId;
// }


export async function createCommunity(
  creatorId: string,
  creatorName: string,
  name: string,
  description: string,
  imageUrl: string = "https://placehold.co/400x200.png", 
  dataAiHint: string = "community group" 
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
      memberCount: 1, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const membershipRef = doc(db, 'communityMemberships', `${creatorId}_${docRef.id}`);
    await setDoc(membershipRef, {
      userId: creatorId,
      communityId: docRef.id,
      joinedAt: serverTimestamp(),
      role: 'admin', 
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
    const q = query(communitiesCollectionRef, orderBy("createdAt", "desc")); 
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

export async function isUserMemberOfCommunity(userId: string, communityId: string): Promise<boolean> {
  if (!userId || !communityId) return false;
  try {
    const membershipId = `${userId}_${communityId}`;
    const membershipDocRef = doc(db, 'communityMemberships', membershipId);
    const docSnap = await getDoc(membershipDocRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking community membership:", error);
    return false;
  }
}

export async function createCommunityPost(
  communityId: string,
  creatorId: string,
  creatorName: string,
  creatorAvatarUrl: string | null | undefined,
  content: string,
  imageUrl?: string,
  dataAiHintImageUrl?: string
): Promise<{ success: boolean; postId?: string; message?: string }> {
  if (!communityId || !creatorId || !content) {
    return { success: false, message: "Community ID, creator ID, and content are required." };
  }

  try {
    // Verify membership
    const isMember = await isUserMemberOfCommunity(creatorId, communityId);
    if (!isMember) {
      return { success: false, message: "User is not a member of this community and cannot post." };
    }

    const postsCollectionRef = collection(db, 'communities', communityId, 'posts');
    const docRef = await addDoc(postsCollectionRef, {
      communityId,
      creatorId,
      creatorName,
      creatorAvatarUrl: creatorAvatarUrl || null,
      content,
      imageUrl: imageUrl || null,
      dataAiHintImageUrl: dataAiHintImageUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error("Error creating community post: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create post: ${errorMessage}` };
  }
}

export async function getCommunityPosts(communityId: string): Promise<CommunityPostData[]> {
  if (!communityId) return [];
  try {
    const postsCollectionRef = collection(db, 'communities', communityId, 'posts');
    const q = query(postsCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const posts: CommunityPostData[] = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as CommunityPostData);
    });
    return posts;
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return [];
  }
}

export async function deleteCommunityPost(
  communityId: string,
  postId: string,
  requestingUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!communityId || !postId || !requestingUserId) {
    return { success: false, message: "Community ID, Post ID, and User ID are required." };
  }
  try {
    const postDocRef = doc(db, 'communities', communityId, 'posts', postId);
    const postSnap = await getDoc(postDocRef);

    if (!postSnap.exists()) {
      return { success: false, message: "Post not found." };
    }

    const postData = postSnap.data() as CommunityPostData;
    if (postData.creatorId !== requestingUserId) {
      // In future, add check for community admin/moderator role here
      return { success: false, message: "You are not authorized to delete this post." };
    }

    await deleteDoc(postDocRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting community post: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to delete post: ${errorMessage}` };
  }
}


// Helper function to set doc with merge for serverTimestamp, used internally
async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  const { serverTimestamp } = await import('firebase/firestore'); 
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

    