
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
  updateDoc, // Added updateDoc
} from 'firebase/firestore';
import type { UserProfileData } from './userProfile';

export interface ChatMessageData {
  id: string;
  channelId: string;
  senderId: string;
  senderName?: string; 
  senderAvatar?: string | null; 
  text: string;
  imageUrl?: string | null;
  timestamp: Timestamp;
}

export interface ChatChannelData {
  id: string; 
  members: string[]; 
  memberInfo?: { 
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
    const errorMsg = `[getOrCreateChatChannel] Valid and distinct user IDs are required. currentUserId: ${currentUserId}, otherUserId: ${otherUserId}`;
    console.error(errorMsg);
    throw new Error('Valid and distinct user IDs are required.');
  }
  console.info(`[getOrCreateChatChannel] Attempting for users: ${currentUserId}, ${otherUserId}`);

  const channelId = generateChannelId(currentUserId, otherUserId);
  const channelRef = doc(db, 'chatChannels', channelId);
  
  try {
    const channelSnap = await getDoc(channelRef);

    if (channelSnap.exists()) {
      console.info(`[getOrCreateChatChannel] Channel ${channelId} exists.`);
      return { channelId, channelData: channelSnap.data() as ChatChannelData, isNew: false };
    } else {
      console.info(`[getOrCreateChatChannel] Channel ${channelId} does not exist. Creating new one.`);
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
        createdAt: serverTimestamp() as Timestamp, 
        updatedAt: serverTimestamp() as Timestamp, 
      };
      await setDoc(channelRef, newChannelData);
      const createdChannelSnap = await getDoc(channelRef); // Re-fetch to get server timestamps
      console.info(`[getOrCreateChatChannel] Channel ${channelId} created successfully.`);
      return { channelId, channelData: createdChannelSnap.data() as ChatChannelData, isNew: true };
    }
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
     console.error(`[getOrCreateChatChannel] Error for users ${currentUserId}, ${otherUserId}: ${errorMessage}`, error);
     throw error; // Rethrow to be handled by caller
  }
}

export async function sendMessage(
  channelId: string,
  senderId: string,
  text: string,
  senderName?: string, 
  senderAvatar?: string | null, 
  imageUrl?: string | null
): Promise<{ success: boolean; messageId?: string; message?: string }> {
  if (!channelId || !senderId || (!text && !imageUrl)) {
    console.warn(`[sendMessage] Missing required fields. channelId: ${channelId}, senderId: ${senderId}`);
    return { success: false, message: 'Channel ID, sender ID, and text or image URL are required.' };
  }
  console.info(`[sendMessage] Attempting for senderId: ${senderId} in channelId: ${channelId}`);

  const channelRef = doc(db, 'chatChannels', channelId);
  const messagesCollectionRef = collection(channelRef, 'messages');

  try {
    const batch = writeBatch(db);
    const newMessageRef = doc(messagesCollectionRef); 
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
      // Unread counts should ideally be handled by a Cloud Function for atomicity and accuracy
      // For example: [`unreadCounts.${recipientId}`]: increment(1)
    });

    await batch.commit();
    console.info(`[sendMessage] Message ${newMessageRef.id} sent by ${senderId} in channel ${channelId}.`);
    return { success: true, messageId: newMessageRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[sendMessage] Error for senderId: ${senderId}, channelId: ${channelId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to send message: ${errorMessage}` };
  }
}

export async function getUserChatChannels(userId: string): Promise<ChatChannelData[]> {
  if (!userId) {
    console.warn('[getUserChatChannels] Missing userId.');
    return [];
  }
  // console.info(`[getUserChatChannels] Fetching channels for userId: ${userId}`);
  try {
    const channelsRef = collection(db, 'chatChannels');
    const q = query(
      channelsRef,
      where('members', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const channels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatChannelData));
    // console.info(`[getUserChatChannels] Found ${channels.length} channels for userId: ${userId}`);
    return channels;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[getUserChatChannels] Error fetching channels for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}

export async function getMessagesForChannel(channelId: string, messageLimit: number = 25): Promise<ChatMessageData[]> {
    if (!channelId) {
      console.warn('[getMessagesForChannel] Missing channelId.');
      return [];
    }
    // console.info(`[getMessagesForChannel] Fetching messages for channelId: ${channelId}, limit: ${messageLimit}`);
    try {
        const messagesRef = collection(db, 'chatChannels', channelId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessageData)).reverse();
        // console.info(`[getMessagesForChannel] Found ${messages.length} messages for channelId: ${channelId}`);
        return messages;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`[getMessagesForChannel] Error fetching messages for channelId: ${channelId}: ${errorMessage}`, error);
        return [];
    }
}

export async function markChannelAsRead(channelId: string, userId: string): Promise<void> {
  if (!channelId || !userId) {
    console.warn(`[markChannelAsRead] Missing channelId or userId. channelId: ${channelId}, userId: ${userId}`);
    return;
  }
  console.info(`[markChannelAsRead] Marking channel ${channelId} as read for userId: ${userId}`);
  const channelRef = doc(db, 'chatChannels', channelId);
  try {
    // Ensure unreadCounts object exists, then set specific user's count to 0
    // This requires a read-then-write if unreadCounts object might not exist, or more complex server-side logic.
    // For simplicity, assuming unreadCounts structure is initialized.
    await updateDoc(channelRef, {
      [`unreadCounts.${userId}`]: 0,
      // updatedAt: serverTimestamp(), // Optional: update channel's updatedAt timestamp
    });
    console.info(`[markChannelAsRead] Successfully marked channel ${channelId} as read for userId: ${userId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[markChannelAsRead] Error for channelId: ${channelId}, userId: ${userId}: ${errorMessage}`, error);
  }
}
