
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
import { createNotification } from './notificationActions';
import { getUserProfile } from './userProfile';

export interface ConnectionData {
  id: string; 
  followerId: string;
  followedId: string;
  createdAt: Timestamp;
}

export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!currentUserId || !targetUserId) {
    console.warn('[followUser] Missing currentUserId or targetUserId.');
    return { success: false, message: 'User IDs are required.' };
  }
  if (currentUserId === targetUserId) {
    console.warn(`[followUser] User ${currentUserId} attempting to follow self.`);
    return { success: false, message: 'You cannot follow yourself.' };
  }
  console.info(`[followUser] Attempting: ${currentUserId} follows ${targetUserId}`);

  const connectionId = `${currentUserId}_${targetUserId}`;
  const connectionRef = doc(db, 'connections', connectionId);
  const currentUserProfileRef = doc(db, 'users', currentUserId);
  const targetUserProfileRef = doc(db, 'users', targetUserId);

  try {
    const connectionSnap = await getDoc(connectionRef);
    if (connectionSnap.exists()) {
      console.info(`[followUser] User ${currentUserId} already follows ${targetUserId}.`);
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
    console.info(`[followUser] Success: ${currentUserId} now follows ${targetUserId}`);

    // Create notification for the followed user
    const followerProfile = await getUserProfile(currentUserId);
    if (followerProfile) {
      await createNotification({
        recipientId: targetUserId,
        type: 'new_follower',
        actorId: currentUserId,
        actorName: followerProfile.fullName || followerProfile.username,
        actorAvatarUrl: followerProfile.photoURL,
        message: `${followerProfile.fullName || followerProfile.username || 'Someone'} started following you.`,
        linkTo: `/profile/${currentUserId}`, // Link to the follower's profile
        entityId: currentUserId,
        entityType: 'user_profile'
      });
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[followUser] Error: ${currentUserId} follows ${targetUserId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to follow user: ${errorMessage}` };
  }
}

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string }> {
  if (!currentUserId || !targetUserId) {
    console.warn('[unfollowUser] Missing currentUserId or targetUserId.');
    return { success: false, message: 'User IDs are required.' };
  }
  console.info(`[unfollowUser] Attempting: ${currentUserId} unfollows ${targetUserId}`);

  const connectionId = `${currentUserId}_${targetUserId}`;
  const connectionRef = doc(db, 'connections', connectionId);
  const currentUserProfileRef = doc(db, 'users', currentUserId);
  const targetUserProfileRef = doc(db, 'users', targetUserId);

  try {
    const connectionSnap = await getDoc(connectionRef);
    if (!connectionSnap.exists()) {
      console.info(`[unfollowUser] User ${currentUserId} is not following ${targetUserId}.`);
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
    console.info(`[unfollowUser] Success: ${currentUserId} unfollowed ${targetUserId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[unfollowUser] Error: ${currentUserId} unfollows ${targetUserId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to unfollow user: ${errorMessage}` };
  }
}

export async function isFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  if (!currentUserId || !targetUserId) {
    // console.warn('[isFollowing] Missing currentUserId or targetUserId.'); // Can be noisy
    return false;
  }
  const connectionId = `${currentUserId}_${targetUserId}`;
  const connectionRef = doc(db, 'connections', connectionId);
  try {
    const docSnap = await getDoc(connectionRef);
    // console.info(`[isFollowing] Status for ${currentUserId} following ${targetUserId}: ${docSnap.exists()}`);
    return docSnap.exists();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[isFollowing] Error checking follow status for ${currentUserId} -> ${targetUserId}: ${errorMessage}`, error);
    return false;
  }
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  if (!userId) {
    console.warn('[getFollowingIds] Missing userId.');
    return [];
  }
  // console.info(`[getFollowingIds] Fetching for userId: ${userId}`);
  try {
    const connectionsRef = collection(db, 'connections');
    const q = query(connectionsRef, where('followerId', '==', userId));
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map((doc) => doc.data().followedId as string);
    // console.info(`[getFollowingIds] User ${userId} is following ${ids.length} users.`);
    return ids;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[getFollowingIds] Error fetching following list for ${userId}: ${errorMessage}`, error);
    return [];
  }
}

export async function getFollowerIds(userId: string): Promise<string[]> {
  if (!userId) {
    console.warn('[getFollowerIds] Missing userId.');
    return [];
  }
  // console.info(`[getFollowerIds] Fetching for userId: ${userId}`);
  try {
    const connectionsRef = collection(db, 'connections');
    const q = query(connectionsRef, where('followedId', '==', userId));
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map((doc) => doc.data().followerId as string);
    // console.info(`[getFollowerIds] User ${userId} has ${ids.length} followers.`);
    return ids;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[getFollowerIds] Error fetching followers list for ${userId}: ${errorMessage}`, error);
    return [];
  }
}

export async function getConnectionsForVisualization(userId: string): Promise<any[]> {
  console.warn("[getConnectionsForVisualization] is not fully implemented. Fetching basic follower/following IDs for now.");
  if (!userId) {
    console.warn('[getConnectionsForVisualization] Missing userId.');
    return [];
  }
  try {
    const following = await getFollowingIds(userId);
    const followers = await getFollowerIds(userId);
  
    return [
      { type: 'following', ids: following },
      { type: 'followers', ids: followers },
    ];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[getConnectionsForVisualization] Error for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}
