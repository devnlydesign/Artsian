
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import type { UserProfileData } from './userProfile'; // For actor info

export interface NotificationData {
  id: string;
  recipientId: string;
  type: 'new_follower' | 'artwork_like' | 'artwork_comment' | 'community_post' | 'system_update' | 'mention' | 'biome_post'; // Add more types as needed
  actorId?: string | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  entityId?: string | null; // e.g., artworkId, postId, userId (for new_follower, this is the follower)
  entityType?: 'artwork' | 'user_profile' | 'post' | 'community' | 'biome' | null;
  message: string; // Pre-constructed message
  linkTo?: string | null; // In-app navigation path
  isRead: boolean;
  createdAt: Timestamp;
}

export async function createNotification(
  notificationData: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>
): Promise<{ success: boolean; notificationId?: string; message?: string }> {
  if (!notificationData.recipientId || !notificationData.type || !notificationData.message) {
    console.warn('[createNotification] Missing required fields:', notificationData);
    return { success: false, message: 'Recipient ID, type, and message are required.' };
  }
  console.info(`[createNotification] Attempting for recipient: ${notificationData.recipientId}, type: ${notificationData.type}`);

  try {
    const notificationsCollectionRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsCollectionRef, {
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    console.info(`[createNotification] Successfully created notificationId: ${docRef.id} for recipient: ${notificationData.recipientId}`);
    // TODO: Consider sending a push notification (FCM) here
    return { success: true, notificationId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[createNotification] Error for recipient: ${notificationData.recipientId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create notification: ${errorMessage}` };
  }
}

export async function getUserNotifications(userId: string, count: number = 20): Promise<NotificationData[]> {
  if (!userId) {
    console.warn('[getUserNotifications] Missing userId.');
    return [];
  }
  // console.info(`[getUserNotifications] Fetching for userId: ${userId}, limit: ${count}`);
  try {
    const notificationsCollectionRef = collection(db, 'notifications');
    const q = query(
      notificationsCollectionRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    const notifications: NotificationData[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as NotificationData));
    // console.info(`[getUserNotifications] Found ${notifications.length} notifications for userId: ${userId}`);
    return notifications;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[getUserNotifications] Error fetching notifications for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}

export async function markNotificationAsRead(
  userId: string, // To ensure only the recipient can mark it
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !notificationId) {
    console.warn('[markNotificationAsRead] Missing userId or notificationId.');
    return { success: false, message: 'User ID and Notification ID are required.' };
  }
  console.info(`[markNotificationAsRead] Attempting for userId: ${userId}, notificationId: ${notificationId}`);
  
  const notificationRef = doc(db, 'notifications', notificationId);
  try {
    const notificationSnap = await getDoc(notificationRef);
    if (!notificationSnap.exists() || notificationSnap.data()?.recipientId !== userId) {
        console.warn(`[markNotificationAsRead] Notification not found or permission denied for userId: ${userId}, notificationId: ${notificationId}`);
        return { success: false, message: "Notification not found or you don't have permission." };
    }
    await updateDoc(notificationRef, { isRead: true });
    console.info(`[markNotificationAsRead] Successfully marked notificationId: ${notificationId} as read for userId: ${userId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[markNotificationAsRead] Error for userId: ${userId}, notificationId: ${notificationId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to mark notification as read: ${errorMessage}` };
  }
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; count?: number; message?: string }> {
  if (!userId) {
    console.warn('[markAllNotificationsAsRead] Missing userId.');
    return { success: false, message: 'User ID is required.' };
  }
  console.info(`[markAllNotificationsAsRead] Attempting for userId: ${userId}`);

  const notificationsCollectionRef = collection(db, 'notifications');
  const q = query(
    notificationsCollectionRef,
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.info(`[markAllNotificationsAsRead] No unread notifications found for userId: ${userId}`);
      return { success: true, count: 0, message: 'No unread notifications.' };
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(document => {
      batch.update(document.ref, { isRead: true });
    });
    await batch.commit();
    console.info(`[markAllNotificationsAsRead] Successfully marked ${querySnapshot.size} notifications as read for userId: ${userId}`);
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[markAllNotificationsAsRead] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to mark all notifications as read: ${errorMessage}` };
  }
}
