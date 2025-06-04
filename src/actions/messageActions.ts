
'use server';

import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, orderBy, limit,
  doc, getDoc, setDoc, addDoc, serverTimestamp, Timestamp,
  writeBatch, arrayUnion, updateDoc, runTransaction
} from 'firebase/firestore';
import type { ConversationData, MessageData } from '@/models/interactionTypes'; // Updated import
import type { UserProfileData } from './userProfile';

// Function to generate a deterministic conversation ID for 1-on-1 chats
function generateDirectConversationId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export async function getOrCreateConversation(
  currentUserId: string,
  otherUserIds: string[], // Can be one for direct, multiple for group
  isGroupChat: boolean = false,
  groupName?: string,
  groupAvatarUrl?: string
): Promise<{ conversationId: string; conversationData: ConversationData; isNew: boolean }> {
  if (!currentUserId || otherUserIds.length === 0) {
    throw new Error("Valid current user ID and at least one other user ID are required.");
  }

  const participants = [...new Set([currentUserId, ...otherUserIds])].sort(); // Ensure unique sorted participants
  if (participants.length < 2) {
    throw new Error("A conversation needs at least two distinct participants.");
  }

  let conversationId: string;
  if (!isGroupChat && participants.length === 2) {
    conversationId = generateDirectConversationId(participants[0], participants[1]);
  } else if (isGroupChat) {
    conversationId = doc(collection(db, 'conversations')).id; // Generate new ID for group chat
  } else {
    throw new Error("Invalid parameters for conversation creation.");
  }

  const conversationRef = doc(db, 'conversations', conversationId);
  
  try {
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      return { conversationId, conversationData: conversationSnap.data() as ConversationData, isNew: false };
    } else {
      // Fetch participant profiles for denormalization (optional, but good for UI)
      const participantInfo: ConversationData['participantInfo'] = {};
      for (const uid of participants) {
        const userProfile = await getDoc(doc(db, 'users', uid));
        if (userProfile.exists()) {
          const data = userProfile.data() as UserProfileData;
          participantInfo[uid] = {
            name: data.fullName || data.username || "User",
            avatarUrl: data.profileImageUrl || data.photoURL || null,
          };
        } else {
           participantInfo[uid] = { name: "User", avatarUrl: null };
        }
      }

      const now = serverTimestamp() as Timestamp;
      const newConversationData: ConversationData = {
        id: conversationId,
        participants,
        participantInfo,
        isGroupChat,
        groupName: isGroupChat ? (groupName || "Group Chat") : null,
        groupAvatarUrl: isGroupChat ? groupAvatarUrl : null,
        createdBy: isGroupChat ? currentUserId : undefined,
        admins: isGroupChat ? [currentUserId] : undefined,
        lastMessageText: null,
        lastMessageTimestamp: null,
        lastMessageSenderId: null,
        unreadCounts: participants.reduce((acc, uid) => ({ ...acc, [uid]: 0 }), {}),
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(conversationRef, newConversationData);
      const createdSnap = await getDoc(conversationRef); // Re-fetch to get server timestamps
      return { conversationId, conversationData: createdSnap.data() as ConversationData, isNew: true };
    }
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
     console.error(`[getOrCreateConversation] Error: ${errorMessage}`, error);
     throw error;
  }
}

export async function sendMessageToConversation(
  conversationId: string,
  senderId: string,
  messageText?: string | null,
  mediaUrl?: string | null,
  mediaType?: MessageData['mediaType']
): Promise<{ success: boolean; messageId?: string; message?: string }> {
  if (!conversationId || !senderId || (!messageText && !mediaUrl)) {
    return { success: false, message: 'Conversation ID, sender ID, and text or media URL are required.' };
  }

  const conversationRef = doc(db, 'conversations', conversationId);
  const messagesCollectionRef = collection(conversationRef, 'chat'); // Messages are in 'chat' subcollection

  try {
    // Denormalize sender info for the message (optional but good for display)
    const senderProfileSnap = await getDoc(doc(db, 'users', senderId));
    const senderName = senderProfileSnap.exists() ? (senderProfileSnap.data() as UserProfileData).username || "User" : "User";
    const senderAvatar = senderProfileSnap.exists() ? (senderProfileSnap.data() as UserProfileData).profileImageUrl || (senderProfileSnap.data() as UserProfileData).photoURL || null : null;

    const batch = writeBatch(db);
    const newMessageRef = doc(messagesCollectionRef); 
    
    const messageData: Omit<MessageData, 'id'> = {
      senderId,
      senderName,
      senderAvatar,
      messageText: messageText || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaUrl ? (mediaType || 'file') : undefined,
      timestamp: serverTimestamp() as Timestamp,
      readBy: [senderId], // Sender has read it
      isDeleted: false,
    };
    batch.set(newMessageRef, messageData);
    
    let lastMessageSummary = messageText ? (messageText.length > 50 ? messageText.substring(0,47) + "..." : messageText) : "Sent media";
    if (mediaUrl && mediaType) lastMessageSummary = `Sent a ${mediaType}`;


    // Update conversation's last message and unread counts
    const conversationSnap = await getDoc(conversationRef);
    if (conversationSnap.exists()) {
        const conversationData = conversationSnap.data() as ConversationData;
        const unreadCountsUpdate: ConversationData['unreadCounts'] = { ...conversationData.unreadCounts };
        conversationData.participants.forEach(uid => {
            if (uid !== senderId) {
                unreadCountsUpdate[uid] = (unreadCountsUpdate[uid] || 0) + 1;
            }
        });
        batch.update(conversationRef, {
            lastMessageText: lastMessageSummary,
            lastMessageTimestamp: serverTimestamp(),
            lastMessageSenderId: senderId,
            updatedAt: serverTimestamp(),
            unreadCounts: unreadCountsUpdate
        });
    }
    
    await batch.commit();
    return { success: true, messageId: newMessageRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[sendMessageToConversation] Error: ${errorMessage}`, error);
    return { success: false, message: `Failed to send message: ${errorMessage}` };
  }
}

export async function getUserConversations(userId: string): Promise<ConversationData[]> {
  if (!userId) return [];
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc') // Order by last message timestamp
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversationData));
  } catch (error) {
    console.error(`[getUserConversations] Error: ${error}`);
    return [];
  }
}

export async function getMessagesForConversation(conversationId: string, messageLimit: number = 25): Promise<MessageData[]> {
    if (!conversationId) return [];
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'chat');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
        const querySnapshot = await getDocs(q);
        // Messages are fetched in reverse chronological order, so reverse again for display
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageData)).reverse();
    } catch (error) {
        console.error(`[getMessagesForConversation] Error: ${error}`);
        return [];
    }
}

export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  if (!conversationId || !userId) return;
  const conversationRef = doc(db, 'conversations', conversationId);
  try {
    await updateDoc(conversationRef, {
      [`unreadCounts.${userId}`]: 0,
      // Optionally update updatedAt if you want this to bump the conversation in lists
      // updatedAt: serverTimestamp(), 
    });
  } catch (error) {
    console.error(`[markConversationAsRead] Error for conversationId: ${conversationId}, userId: ${userId}: ${error}`);
  }
}
    
