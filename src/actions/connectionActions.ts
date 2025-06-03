
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';

export interface ConnectionData {
  id: string; // followerUserId_followedUserId
  followerId: string;
  followedId: string;
  createdAt: Timestamp;
}

// --- Follow a User ---
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!currentUserId || !targetUserId) {
    return { success: false, message: 'User IDs are required.' };
  }
  if (currentUserId === targetUserId) {
    return { success: false, message: 'You cannot follow yourself.' };
  }

  const connectionId = `${currentUserId}_${targetUserId}`;
  const connectionRef = doc(db, 'connections', connectionId);
  const currentUserProfileRef = doc(db, 'users', currentUserId);
  const targetUserProfileRef = doc(db, 'users', targetUserId);

  try {
    const connectionSnap = await getDoc(connectionRef);
    if (connectionSnap.exists()) {
      return { success: false, message: 'You are already following this user.' };
    }

    const batch = writeBatch(db);

    batch.set(connectionRef, {
      followerId: currentUserId,
      followedId: targetUserId,
      createdAt: serverTimestamp(),
    });

    batch.update(currentUserProfileRef, {
      followingCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    batch.update(targetUserProfileRef, {
      followersCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to follow user: ${errorMessage}` };
  }
}

// --- Unfollow a User ---
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!currentUserId || !targetUserId) {
    return { success: false, message: 'User IDs are required.' };
  }

  const connectionId = `${currentUserId}_${targetUserId}`;
  const connectionRef = doc(db, 'connections', connectionId);
  const currentUserProfileRef = doc(db, 'users', currentUserId);
  const targetUserProfileRef = doc(db, 'users', targetUserId);

  try {
    const connectionSnap = await getDoc(connectionRef);
    if (!connectionSnap.exists()) {
      return { success: false, message: 'You are not following this user.' };
    }

    const batch = writeBatch(db);

    batch.delete(connectionRef);

    batch.update(currentUserProfileRef, {
      followingCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
    batch.update(targetUserProfileRef, {
      followersCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to unfollow user: ${errorMessage}` };
  }
}

// --- Check if a user is following another ---
export async function isFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  if (!currentUserId || !targetUserId) {
    return false;
  }
  const connectionId = `${currentUserId}_${targetUserId}`;
  const connectionRef = doc(db, 'connections', connectionId);
  try {
    const docSnap = await getDoc(connectionRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

// --- Get IDs of users someone is following ---
export async function getFollowingIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const connectionsRef = collection(db, 'connections');
    const q = query(connectionsRef, where('followerId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().followedId as string);
  } catch (error) {
    console.error('Error fetching following list:', error);
    return [];
  }
}

// --- Get IDs of users who follow someone ---
export async function getFollowerIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const connectionsRef = collection(db, 'connections');
    const q = query(connectionsRef, where('followedId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().followerId as string);
  } catch (error) {
    console.error('Error fetching followers list:', error);
    return [];
  }
}

// Placeholder for more complex data retrieval for visualization
export async function getConnectionsForVisualization(userId: string): Promise<any[]> {
  // This would involve fetching followers, following, and potentially 2nd-degree connections
  // and their profile data for the visualization component.
  // For now, it's a placeholder.
  console.warn("getConnectionsForVisualization is not fully implemented. Fetching basic follower/following IDs for now.");
  const following = await getFollowingIds(userId);
  const followers = await getFollowerIds(userId);
  
  // In a real scenario, you'd fetch profile details for these IDs.
  return [
    { type: 'following', ids: following },
    { type: 'followers', ids: followers },
  ];
}
