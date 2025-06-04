
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
  // No moderation fields needed for community details itself currently,
  // but posts within a community will have them.
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
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
  };
}

export async function createCommunity(
  creatorId: string,
  creatorName: string,
  name: string,
  description: string,
  imageUrl: string = "https://placehold.co/400x200.png",
  dataAiHint: string = "community group"
): Promise<{ success: boolean; communityId?: string; message?: string }> {
  if (!creatorId || !name || !description) {
    console.warn(`[createCommunity] Missing required fields. creatorId: ${creatorId}, name: ${name}`);
    return { success: false, message: "Creator ID, name, and description are required." };
  }
  console.info(`[createCommunity] Attempting for creatorId: ${creatorId}, name: ${name}`);
  // TODO: Community name and description could be moderated here or via Cloud Function trigger if needed.

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
    await setDocInternal(membershipRef, { // Changed to setDocInternal
      userId: creatorId,
      communityId: docRef.id,
      joinedAt: serverTimestamp(),
      role: 'admin',
    });

    console.info(`[createCommunity] Successfully created communityId: ${docRef.id} by creatorId: ${creatorId}`);
    return { success: true, communityId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createCommunity] Error for creatorId: ${creatorId}, name: ${name}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create community: ${errorMessage}` };
  }
}

export async function getAllPublicCommunities(): Promise<CommunityData[]> {
  // console.info("[getAllPublicCommunities] Fetching all public communities.");
  try {
    const communitiesCollectionRef = collection(db, 'communities');
    // PERFORMANCE & SCALABILITY:
    // 1. For production, implement pagination (e.g., using limit() and startAfter()).
    // 2. Ensure composite index on (createdAt desc) if not automatically created.
    const q = query(communitiesCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const communities: CommunityData[] = [];
    querySnapshot.forEach((doc) => {
      communities.push({ id: doc.id, ...doc.data() } as CommunityData);
    });
    // console.info(`[getAllPublicCommunities] Found ${communities.length} communities.`);
    return communities;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getAllPublicCommunities] Error: ${errorMessage}`, error);
    return [];
  }
}

export async function getCommunityById(communityId: string): Promise<CommunityData | null> {
  if (!communityId) {
    console.warn('[getCommunityById] Missing communityId.');
    return null;
  }
  // console.info(`[getCommunityById] Fetching communityId: ${communityId}`);
  try {
    const communityDocRef = doc(db, 'communities', communityId);
    const docSnap = await getDoc(communityDocRef);
    if (docSnap.exists()) {
      // console.info(`[getCommunityById] Found communityId: ${communityId}`);
      return { id: docSnap.id, ...docSnap.data() } as CommunityData;
    }
    console.warn(`[getCommunityById] Community not found: ${communityId}`);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getCommunityById] Error fetching communityId: ${communityId}: ${errorMessage}`, error);
    return null;
  }
}


export async function joinCommunity(
  userId: string,
  communityId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !communityId) {
    console.warn(`[joinCommunity] Missing userId or communityId. userId: ${userId}, communityId: ${communityId}`);
    return { success: false, message: "User ID and Community ID are required." };
  }
  console.info(`[joinCommunity] Attempting for userId: ${userId} to join communityId: ${communityId}`);

  try {
    const batch = writeBatch(db);
    const membershipId = `${userId}_${communityId}`;
    const membershipDocRef = doc(db, 'communityMemberships', membershipId);

    const membershipSnap = await getDoc(membershipDocRef);
    if (membershipSnap.exists()) {
      console.info(`[joinCommunity] User ${userId} is already a member of community ${communityId}.`);
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
    console.info(`[joinCommunity] User ${userId} successfully joined community ${communityId}.`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[joinCommunity] Error for userId: ${userId}, communityId: ${communityId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to join community: ${errorMessage}` };
  }
}

export async function leaveCommunity(
  userId: string,
  communityId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !communityId) {
    console.warn(`[leaveCommunity] Missing userId or communityId. userId: ${userId}, communityId: ${communityId}`);
    return { success: false, message: "User ID and Community ID are required." };
  }
  console.info(`[leaveCommunity] Attempting for userId: ${userId} to leave communityId: ${communityId}`);

  try {
    const batch = writeBatch(db);
    const membershipId = `${userId}_${communityId}`;
    const membershipDocRef = doc(db, 'communityMemberships', membershipId);

    const membershipSnap = await getDoc(membershipDocRef);
    if (!membershipSnap.exists()) {
      console.warn(`[leaveCommunity] User ${userId} is not a member of community ${communityId}.`);
      return { success: false, message: "User is not a member of this community." };
    }

    batch.delete(membershipDocRef);

    const communityDocRef = doc(db, 'communities', communityId);
    batch.update(communityDocRef, {
      memberCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    console.info(`[leaveCommunity] User ${userId} successfully left community ${communityId}.`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[leaveCommunity] Error for userId: ${userId}, communityId: ${communityId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to leave community: ${errorMessage}` };
  }
}

export async function getUserCommunityMemberships(userId: string): Promise<CommunityMembershipData[]> {
  if (!userId) {
    console.warn('[getUserCommunityMemberships] Missing userId.');
    return [];
  }
  // console.info(`[getUserCommunityMemberships] Fetching for userId: ${userId}`);
  try {
    const membershipsCollectionRef = collection(db, 'communityMemberships');
    // PERFORMANCE & SCALABILITY: Ensure composite index on (userId, joinedAt) if sorting/filtering by join date.
    const q = query(membershipsCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const memberships: CommunityMembershipData[] = [];
    querySnapshot.forEach((doc) => {
      memberships.push({ id: doc.id, ...doc.data() } as CommunityMembershipData);
    });
    // console.info(`[getUserCommunityMemberships] Found ${memberships.length} memberships for userId: ${userId}`);
    return memberships;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getUserCommunityMemberships] Error fetching memberships for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}

export async function isUserMemberOfCommunity(userId: string, communityId: string): Promise<boolean> {
  if (!userId || !communityId) {
    // console.warn(`[isUserMemberOfCommunity] Missing userId or communityId. userId: ${userId}, communityId: ${communityId}`);
    return false;
  }
  // console.info(`[isUserMemberOfCommunity] Checking for userId: ${userId}, communityId: ${communityId}`);
  try {
    const membershipId = `${userId}_${communityId}`;
    const membershipDocRef = doc(db, 'communityMemberships', membershipId);
    const docSnap = await getDoc(membershipDocRef);
    const isMember = docSnap.exists();
    // console.info(`[isUserMemberOfCommunity] Membership status for userId: ${userId}, communityId: ${communityId}: ${isMember}`);
    return isMember;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[isUserMemberOfCommunity] Error checking membership for userId: ${userId}, communityId: ${communityId}: ${errorMessage}`, error);
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
    console.warn(`[createCommunityPost] Missing required fields. communityId: ${communityId}, creatorId: ${creatorId}`);
    return { success: false, message: "Community ID, creator ID, and content are required." };
  }
  console.info(`[createCommunityPost] Attempting for creatorId: ${creatorId} in communityId: ${communityId}`);

  try {
    const isMember = await isUserMemberOfCommunity(creatorId, communityId);
    if (!isMember) {
      console.warn(`[createCommunityPost] User ${creatorId} is not a member of community ${communityId}.`);
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
      moderationStatus: 'pending', // Default moderation status for new posts
      moderationInfo: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createCommunityPost] Post ${docRef.id} created by ${creatorId} in community ${communityId}. Moderation status: pending.`);
    // TODO: Trigger content moderation Cloud Function here for the new post (docRef.id)
    // This function would analyze 'content' and 'imageUrl'
    return { success: true, postId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createCommunityPost] Error for creatorId: ${creatorId}, communityId: ${communityId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create post: ${errorMessage}` };
  }
}

export async function getCommunityPosts(communityId: string): Promise<CommunityPostData[]> {
  if (!communityId) {
    console.warn('[getCommunityPosts] Missing communityId.');
    return [];
  }
  // console.info(`[getCommunityPosts] Fetching posts for communityId: ${communityId}`);
  try {
    const postsCollectionRef = collection(db, 'communities', communityId, 'posts');
    // PERFORMANCE & SCALABILITY:
    // 1. Ensure composite index on (createdAt desc) if not automatically created.
    // 2. For production, implement pagination (e.g., using limit() and startAfter()).
    // 3. CONTENT MODERATION: Add where("moderationStatus", "==", "approved") if only approved posts should be shown.
    const q = query(postsCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const posts: CommunityPostData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        moderationStatus: data.moderationStatus ?? 'approved', // Default to approved for display
        moderationInfo: data.moderationInfo ?? null,
      } as CommunityPostData);
    });
    // console.info(`[getCommunityPosts] Found ${posts.length} posts for communityId: ${communityId}`);
    return posts;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getCommunityPosts] Error fetching posts for communityId: ${communityId}: ${errorMessage}`, error);
    return [];
  }
}

export async function deleteCommunityPost(
  communityId: string,
  postId: string,
  requestingUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!communityId || !postId || !requestingUserId) {
    console.warn(`[deleteCommunityPost] Missing required fields. communityId: ${communityId}, postId: ${postId}, userId: ${requestingUserId}`);
    return { success: false, message: "Community ID, Post ID, and User ID are required." };
  }
  console.info(`[deleteCommunityPost] Attempting for userId: ${requestingUserId} to delete postId: ${postId} in communityId: ${communityId}`);
  try {
    const postDocRef = doc(db, 'communities', communityId, 'posts', postId);
    const postSnap = await getDoc(postDocRef);

    if (!postSnap.exists()) {
      console.warn(`[deleteCommunityPost] Post not found: ${postId} in community ${communityId}.`);
      return { success: false, message: "Post not found." };
    }

    const postData = postSnap.data() as CommunityPostData;
    // Add check for community admin/moderator role if implementing such roles
    if (postData.creatorId !== requestingUserId) {
      console.warn(`[deleteCommunityPost] User ${requestingUserId} not authorized to delete post ${postId}. Creator is ${postData.creatorId}.`);
      return { success: false, message: "You are not authorized to delete this post." };
    }

    await deleteDoc(postDocRef);
    console.info(`[deleteCommunityPost] Post ${postId} deleted by ${requestingUserId} in community ${communityId}.`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[deleteCommunityPost] Error for postId: ${postId}, communityId: ${communityId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to delete post: ${errorMessage}` };
  }
}

async function setDocInternal(docRef: any, data: any, options?: { merge?: boolean }) { // Renamed from setDoc to setDocInternal
  const { serverTimestamp: fsServerTimestamp } = await import('firebase/firestore');
  const dataWithTimestamps = Object.keys(data).reduce((acc, key) => {
    if (data[key] === fsServerTimestamp()) { // Use aliased import
      acc[key] = fsServerTimestamp();
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {} as any);

  const { setDoc: firestoreSetDocOriginal } = await import('firebase/firestore'); // Original setDoc
  return firestoreSetDocOriginal(docRef, dataWithTimestamps, options);
}
