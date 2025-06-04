
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import type { UserProfileData } from './userProfile';

export interface ChatMessageData {
  id: string;
  channelId: string;
  senderId: string;
  senderName?: string; // Denormalized for convenience
  senderAvatar?: string | null; // Denormalized
  text: string;
  imageUrl?: string | null;
  timestamp: Timestamp;
  // isRead?: boolean; // Consider client-side or more complex unread tracking
}

export interface ChatChannelData {
  id: string; // Combined UIDs: uid1_uid2 (sorted)
  members: string[]; // Array of 2 user UIDs
  memberInfo?: { // Denormalized info for quick display
    [userId: string]: {
      name?: string;
      avatarUrl?: string | null;
    }
  };
  lastMessageText?: string | null;
  lastMessageTimestamp?: Timestamp | null;
  lastMessageSenderId?: string | null;
  unreadCounts?: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Firestore Security Rules Reminder:
// match /chatChannels/{channelId} {
//   function isChannelMember() { return request.auth.uid in resource.data.members; }
//   function isCreatingOwnChannel() {
//     let members = request.resource.data.members;
//     return request.auth.uid in members && members.size() == 2 && members[0] < members[1];
//   }
//   allow read, update: if isChannelMember();
//   allow create: if isCreatingOwnChannel();
//
//   match /messages/{messageId} {
//     function isChannelMemberFromParent() { return request.auth.uid in get(/databases/$(database)/documents/chatChannels/$(channelId)).data.members; }
//     allow read: if isChannelMemberFromParent();
//     allow create: if isChannelMemberFromParent() && request.auth.uid == request.resource.data.senderId;
//     // update, delete: if false; // Or more complex rules
//   }
// }


function generateChannelId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export async function getOrCreateChatChannel(
  currentUserId: string,
  otherUserId: string,
  currentUserProfile?: Pick<UserProfileData, 'fullName' | 'username' | 'photoURL'>,
  otherUserProfile?: Pick<UserProfileData, 'fullName' | 'username' | 'photoURL'>,
): Promise<{ channelId: string; channelData: ChatChannelData; isNew: boolean }> {
  if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
    throw new Error('Valid and distinct user IDs are required.');
  }

  const channelId = generateChannelId(currentUserId, otherUserId);
  const channelRef = doc(db, 'chatChannels', channelId);
  const channelSnap = await getDoc(channelRef);

  if (channelSnap.exists()) {
    return { channelId, channelData: channelSnap.data() as ChatChannelData, isNew: false };
  } else {
    const currentUserName = currentUserProfile?.fullName || currentUserProfile?.username || 'User';
    const otherUserName = otherUserProfile?.fullName || otherUserProfile?.username || 'User';

    const newChannelData: ChatChannelData = {
      id: channelId,
      members: [currentUserId, otherUserId].sort(),
      memberInfo: {
        [currentUserId]: {
            name: currentUserName,
            avatarUrl: currentUserProfile?.photoURL || null,
        },
        [otherUserId]: {
            name: otherUserName,
            avatarUrl: otherUserProfile?.photoURL || null,
        }
      },
      lastMessageText: null,
      lastMessageTimestamp: null,
      lastMessageSenderId: null,
      unreadCounts: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      createdAt: serverTimestamp() as Timestamp, // Cast for new docs
      updatedAt: serverTimestamp() as Timestamp, // Cast for new docs
    };
    await setDoc(channelRef, newChannelData);
     // Re-fetch to get server timestamps resolved, or return newChannelData directly if local Timestamp object is acceptable for immediate use.
    const createdChannelSnap = await getDoc(channelRef);
    return { channelId, channelData: createdChannelSnap.data() as ChatChannelData, isNew: true };
  }
}

export async function sendMessage(
  channelId: string,
  senderId: string,
  text: string,
  senderName?: string, // Optional, can be fetched or passed
  senderAvatar?: string | null, // Optional
  imageUrl?: string | null
): Promise<{ success: boolean; messageId?: string; message?: string }> {
  if (!channelId || !senderId || (!text && !imageUrl)) {
    return { success: false, message: 'Channel ID, sender ID, and text or image URL are required.' };
  }

  const channelRef = doc(db, 'chatChannels', channelId);
  const messagesCollectionRef = collection(channelRef, 'messages');

  try {
    const batch = writeBatch(db);

    const newMessageRef = doc(messagesCollectionRef); // Auto-generate ID
    batch.set(newMessageRef, {
      channelId,
      senderId,
      senderName: senderName || 'User',
      senderAvatar: senderAvatar || null,
      text: text || '',
      imageUrl: imageUrl || null,
      timestamp: serverTimestamp(),
    });

    batch.update(channelRef, {
      lastMessageText: text ? (text.length > 50 ? text.substring(0,47) + "..." : text) : (imageUrl ? "Sent an image" : "Empty message"),
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: senderId,
      updatedAt: serverTimestamp(),
      // Basic unread count increment - this is prone to race conditions without transactions or Cloud Functions
      // For a robust system, use Firebase Functions to update unread counts transactionally
      // [`unreadCounts.${recipientId}`]: increment(1) // This requires knowing the recipientId
    });

    await batch.commit();
    return { success: true, messageId: newMessageRef.id };
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to send message: ${errorMessage}` };
  }
}

export async function getUserChatChannels(userId: string): Promise<ChatChannelData[]> {
  if (!userId) return [];
  try {
    const channelsRef = collection(db, 'chatChannels');
    const q = query(
      channelsRef,
      where('members', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatChannelData));
  } catch (error) {
    console.error('Error fetching user chat channels:', error);
    return [];
  }
}

// Client-side will use onSnapshot for real-time messages. This could be for initial batch.
export async function getMessagesForChannel(channelId: string, messageLimit: number = 25): Promise<ChatMessageData[]> {
    if (!channelId) return [];
    try {
        const messagesRef = collection(db, 'chatChannels', channelId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
        const querySnapshot = await getDocs(q);
        // Messages are fetched in desc order for pagination, reverse for display
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessageData)).reverse();
    } catch (error) {
        console.error(`Error fetching messages for channel ${channelId}:`, error);
        return [];
    }
}

export async function markChannelAsRead(channelId: string, userId: string): Promise<void> {
  if (!channelId || !userId) return;
  const channelRef = doc(db, 'chatChannels', channelId);
  try {
    await updateDoc(channelRef, {
      [`unreadCounts.${userId}`]: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error marking channel ${channelId} as read for user ${userId}:`, error);
  }
}
