
'use server';

import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, orderBy, limit,
  doc, getDoc, setDoc, addDoc, serverTimestamp, Timestamp,
  writeBatch, arrayUnion, updateDoc, runTransaction
} from 'firebase/firestore';
import type { ConversationData, MessageData } from '@/models/interactionTypes'; 
import type { UserProfileData } from './userProfile';

function generateDirectConversationId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export async function getOrCreateConversation(
  currentUserId: string,
  otherUserIds: string[], 
  isGroupChat: boolean = false,
  groupName?: string,
  groupAvatarUrl?: string
): Promise<{ conversationId: string; conversationData: ConversationData; isNew: boolean }> {
  if (!currentUserId || otherUserIds.length === 0) {
    throw new Error("Valid current user ID and at least one other user ID are required.");
  }
  console.info(`[getOrCreateConversation] User ${currentUserId} with users: ${otherUserIds.join(', ')}`);

  const participants = [...new Set([currentUserId, ...otherUserIds])].sort(); 
  if (participants.length < 2 && !isGroupChat) { 
    throw new Error("A 1-on-1 conversation needs at least two distinct participants.");
  }

  let conversationId: string;
  if (!isGroupChat && participants.length === 2) {
    conversationId = generateDirectConversationId(participants[0], participants[1]);
  } else if (isGroupChat) {
    conversationId = doc(collection(db, 'conversations')).id; 
  } else {
    throw new Error("Invalid parameters for conversation creation. For group chats, ensure isGroupChat is true.");
  }

  const conversationRef = doc(db, 'conversations', conversationId);
  
  try {
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      console.info(`[getOrCreateConversation] Found existing conversation ${conversationId}`);
      return { conversationId, conversationData: conversationSnap.data() as ConversationData, isNew: false };
    } else {
      console.info(`[getOrCreateConversation] Creating new conversation ${conversationId}`);
      const participantInfo: ConversationData['participantInfo'] = {};
      for (const uid of participants) {
        const userProfileDoc = await getDoc(doc(db, 'users', uid));
        if (userProfileDoc.exists()) {
          const data = userProfileDoc.data() as UserProfileData;
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
      
      const createdSnap = await getDoc(conversationRef);
      if (!createdSnap.exists()) { 
          throw new Error("Failed to create and re-fetch conversation document.");
      }
      console.info(`[getOrCreateConversation] Successfully created conversation ${conversationId}`);
      return { conversationId, conversationData: createdSnap.data() as ConversationData, isNew: true };
    }
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
     console.error(`[getOrCreateConversation] Error: ${errorMessage}`, error);
     throw new Error(`Failed to get or create conversation: ${errorMessage}`);
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
  console.info(`[sendMessageToConversation] User ${senderId} sending message to conversation ${conversationId}`);

  const conversationRef = doc(db, 'conversations', conversationId);
  const messagesCollectionRef = collection(conversationRef, 'chat'); 

  try {
    const senderProfileSnap = await getDoc(doc(db, 'users', senderId));
    const senderName = senderProfileSnap.exists() ? ((senderProfileSnap.data() as UserProfileData).fullName || (senderProfileSnap.data() as UserProfileData).username || "User") : "User";
    const senderAvatar = senderProfileSnap.exists() ? ((senderProfileSnap.data() as UserProfileData).profileImageUrl || (senderProfileSnap.data() as UserProfileData).photoURL || null) : null;

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
      readBy: [senderId], 
      isDeleted: false,
    };
    batch.set(newMessageRef, messageData);
    
    let lastMessageSummary = messageText ? (messageText.length > 50 ? messageText.substring(0,47) + "..." : messageText) : "Sent media";
    if (mediaUrl && mediaType) lastMessageSummary = `Sent a ${mediaType}`;


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
    console.info(`[sendMessageToConversation] Message ${newMessageRef.id} sent successfully to ${conversationId}`);
    return { success: true, messageId: newMessageRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[sendMessageToConversation] Error: ${errorMessage}`, error);
    return { success: false, message: `Failed to send message: ${errorMessage}` };
  }
}

export async function getUserConversations(userId: string): Promise<ConversationData[]> {
  if (!userId) {
    console.warn("[getUserConversations] Missing userId.");
    return [];
  }
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc') 
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversationData));
  } catch (error) {
    console.error(`[getUserConversations] Error for userId ${userId}: ${error}`);
    return [];
  }
}

export async function getMessagesForConversation(conversationId: string, messageLimit: number = 25): Promise<MessageData[]> {
    if (!conversationId) {
        console.warn("[getMessagesForConversation] Missing conversationId.");
        return [];
    }
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'chat');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageData)).reverse();
    } catch (error) {
        console.error(`[getMessagesForConversation] Error for conversationId ${conversationId}: ${error}`);
        return [];
    }
}

export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  if (!conversationId || !userId) {
    console.warn("[markConversationAsRead] Missing conversationId or userId.");
    return;
  }
  const conversationRef = doc(db, 'conversations', conversationId);
  try {
    await updateDoc(conversationRef, {
      [`unreadCounts.${userId}`]: 0,
    });
    console.info(`[markConversationAsRead] Conversation ${conversationId} marked as read for user ${userId}`);
  } catch (error) {
    console.error(`[markConversationAsRead] Error for conversationId: ${conversationId}, userId: ${userId}: ${error}`);
  }
}
    
