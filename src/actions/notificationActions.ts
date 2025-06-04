
'use server';

import { db } from '@/lib/firebase';
import {
  collection, addDoc, query, where, orderBy, getDocs,
  doc, updateDoc, serverTimestamp, Timestamp, writeBatch, limit
} from 'firebase/firestore';
import type { NotificationData, ContentType } from '@/models/interactionTypes'; // Updated import
// UserProfileData might not be directly needed here unless denormalizing sender info more deeply

export async function createPlatformNotification( // Renamed to avoid conflict if old NotificationData existed
  notificationDetails: Omit<NotificationData, 'id' | 'createdAt' | 'read'>
): Promise<{ success: boolean; notificationId?: string; message?: string }> {
  if (!notificationDetails.recipientId || !notificationDetails.type || !notificationDetails.message) {
    return { success: false, message: 'Recipient ID, type, and message are required for notification.' };
  }

  try {
    const notificationsCollectionRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsCollectionRef, {
      ...notificationDetails,
      read: false,
      createdAt: serverTimestamp(),
    });
    // TODO: Consider sending a push notification (FCM) here if applicable
    return { success: true, notificationId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[createPlatformNotification] Error for recipient: ${notificationDetails.recipientId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create notification: ${errorMessage}` };
  }
}

export async function getUserPlatformNotifications(userId: string, count: number = 20): Promise<NotificationData[]> {
  if (!userId) return [];
  try {
    const notificationsCollectionRef = collection(db, 'notifications');
    const q = query(
      notificationsCollectionRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as NotificationData));
  } catch (error) {
    console.error(`[getUserPlatformNotifications] Error fetching notifications for userId: ${userId}: ${error}`);
    return [];
  }
}

export async function markPlatformNotificationAsRead(
  userId: string, // To ensure only the recipient can mark it
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !notificationId) {
    return { success: false, message: 'User ID and Notification ID are required.' };
  }
  
  const notificationRef = doc(db, 'notifications', notificationId);
  try {
    const notificationSnap = await getDoc(notificationRef);
    if (!notificationSnap.exists() || notificationSnap.data()?.recipientId !== userId) {
        return { success: false, message: "Notification not found or you don't have permission." };
    }
    await updateDoc(notificationRef, { read: true });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[markPlatformNotificationAsRead] Error for userId: ${userId}, notificationId: ${notificationId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to mark notification as read: ${errorMessage}` };
  }
}

export async function markAllPlatformNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; count?: number; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }

  const notificationsCollectionRef = collection(db, 'notifications');
  const q = query(
    notificationsCollectionRef,
    where('recipientId', '==', userId),
    where('read', '==', false)
  );

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: true, count: 0, message: 'No unread notifications.' };
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(document => {
      batch.update(document.ref, { read: true });
    });
    await batch.commit();
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[markAllPlatformNotificationsAsRead] Error for userId: ${userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to mark all notifications as read: ${errorMessage}` };
  }
}
    