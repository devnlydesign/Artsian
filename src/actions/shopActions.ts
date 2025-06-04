
'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import type { UserProfileData } from './userProfile';

export interface ShopItemData {
  id: string;
  artistId: string;
  artistName?: string;
  name: string;
  description: string;
  priceInCents: number;
  imageUrl: string; // Primary display image URL (e.g., a thumbnail)
  imageUrlOriginal?: string; // URL of the original uploaded image
  // imageUrl_thumbnail_200x200?: string; // Example if Resize Extension creates this
  dataAiHint?: string;
  category?: string;
  crystallineBloomId?: string | null;
  stock?: number | null;
  isDigital?: boolean;
  tags?: string[];
  isPublished?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderationInfo?: {
    checkedAt?: Timestamp;
    reason?: string;
    autoModerated?: boolean;
  };
}

export interface OrderItemData {
  itemId: string;
  name: string;
  priceInCents: number;
  quantity: number;
  imageUrl?: string; // Should be a displayable thumbnail URL
  crystallineBloomId?: string | null;
}

export interface OrderData {
  id: string;
  userId: string;
  userEmail?: string;
  items: OrderItemData[];
  totalAmountInCents: number;
  status: 'pending' | 'paid' | 'shipped' | 'fulfilled' | 'cancelled' | 'refunded';
  stripeCheckoutSessionId: string;
  shippingAddress?: any;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function createShopItem(
  artistId: string,
  itemDetails: Omit<ShopItemData, 'id' | 'artistId' | 'artistName' | 'createdAt' | 'updatedAt' | 'isPublished' | 'moderationStatus' | 'moderationInfo' | 'imageUrlOriginal'> & {isPublished?: boolean; imageUrlOriginal?: string;}
): Promise<{ success: boolean; itemId?: string; message?: string }> {
  if (!artistId) {
    const msg = '[createShopItem] Missing artistId.';
    console.warn(msg);
    return { success: false, message: "Artist ID is required." };
  }
  if (!itemDetails.name || itemDetails.priceInCents == null || !itemDetails.imageUrl) {
    const msg = `[createShopItem] Missing required fields for artistId: ${artistId}, name: ${itemDetails.name}`;
    console.warn(msg);
    return { success: false, message: "Item name, price, and image URL are required." };
  }
  if (itemDetails.priceInCents < 50) {
    const msg = `[createShopItem] Price too low for artistId: ${artistId}, name: ${itemDetails.name}, price: ${itemDetails.priceInCents}`;
    console.warn(msg);
    return { success: false, message: "Price must be at least $0.50." };
  }
  console.info(`[createShopItem] Attempting for artistId: ${artistId}, name: ${itemDetails.name}`);

  try {
    const artistProfileDoc = doc(db, 'users', artistId);
    const artistSnap = await getDoc(artistProfileDoc);
    const artistName = artistSnap.exists() ? (artistSnap.data() as UserProfileData).fullName || (artistSnap.data() as UserProfileData).username : "Charisarthub Artist";

    const shopItemsCollectionRef = collection(db, 'shopItems');
    const docRef = await addDoc(shopItemsCollectionRef, {
      ...itemDetails,
      artistId: artistId,
      artistName: artistName,
      imageUrlOriginal: itemDetails.imageUrlOriginal || itemDetails.imageUrl, // Store original URL
      isPublished: itemDetails.isPublished ?? true,
      stock: itemDetails.stock ?? null,
      isDigital: itemDetails.isDigital ?? false,
      crystallineBloomId: itemDetails.crystallineBloomId || null,
      tags: itemDetails.tags || [],
      moderationStatus: 'pending',
      moderationInfo: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createShopItem] Successfully created itemId: ${docRef.id} for artistId: ${artistId}. Moderation status: pending.`);
    // TODO: Trigger content moderation Cloud Function here for the new shop item (docRef.id)
    return { success: true, itemId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createShopItem] Error for artistId: ${artistId}, name: ${itemDetails.name}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create shop item: ${errorMessage}` };
  }
}

export async function updateShopItem(
  artistId: string,
  itemId: string,
  itemDetails: Partial<Omit<ShopItemData, 'id' | 'artistId' | 'createdAt' | 'updatedAt' | 'artistName' | 'imageUrlOriginal'>> & { imageUrlOriginal?: string }
): Promise<{ success: boolean; message?: string }> {
  if (!artistId || !itemId) {
    const msg = '[updateShopItem] Missing artistId or itemId.';
    console.warn(msg);
    return { success: false, message: "Artist ID and Item ID are required." };
  }
  console.info(`[updateShopItem] Attempting for artistId: ${artistId}, itemId: ${itemId}`);

  const itemDocRef = doc(db, 'shopItems', itemId);
  try {
    const itemSnap = await getDoc(itemDocRef);
    if (!itemSnap.exists() || itemSnap.data()?.artistId !== artistId) {
      const msg = `[updateShopItem] Item not found or permission denied for artistId: ${artistId}, itemId: ${itemId}`;
      console.warn(msg);
      return { success: false, message: "Shop item not found or you do not have permission to update it." };
    }

    const updateData: Partial<ShopItemData> & { updatedAt: Timestamp } = { ...itemDetails, updatedAt: serverTimestamp() };
    if (itemDetails.imageUrl) { // If new main imageUrl is provided, it's likely the new original.
        updateData.imageUrlOriginal = itemDetails.imageUrl;
    } else if (itemDetails.imageUrlOriginal) { // If only imageUrlOriginal is provided
        updateData.imageUrlOriginal = itemDetails.imageUrlOriginal;
    }


    const existingData = itemSnap.data() as ShopItemData;
    if (
      (itemDetails.name && itemDetails.name !== existingData.name) ||
      (itemDetails.description && itemDetails.description !== existingData.description) ||
      (itemDetails.imageUrl && itemDetails.imageUrl !== existingData.imageUrl) // Check if the display URL changed
    ) {
      updateData.moderationStatus = 'pending';
      updateData.moderationInfo = { reason: "Content updated.", autoModerated: false };
      console.info(`[updateShopItem] Shop item ${itemId} fields changed, resetting moderationStatus to pending.`);
      // TODO: Trigger content moderation Cloud Function here for the updated shop item (itemId)
    }

    await updateDoc(itemDocRef, updateData);
    console.info(`[updateShopItem] Successfully updated itemId: ${itemId} for artistId: ${artistId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[updateShopItem] Error for artistId: ${artistId}, itemId: ${itemId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to update shop item: ${errorMessage}` };
  }
}

export async function deleteShopItem(
  artistId: string,
  itemId: string
): Promise<{ success: boolean; message?: string }> {
  if (!artistId || !itemId) {
    const msg = '[deleteShopItem] Missing artistId or itemId.';
    console.warn(msg);
    return { success: false, message: "Artist ID and Item ID are required." };
  }
  console.info(`[deleteShopItem] Attempting for artistId: ${artistId}, itemId: ${itemId}`);

  const itemDocRef = doc(db, 'shopItems', itemId);
  try {
    const itemSnap = await getDoc(itemDocRef);
    if (!itemSnap.exists() || itemSnap.data()?.artistId !== artistId) {
      const msg = `[deleteShopItem] Item not found or permission denied for artistId: ${artistId}, itemId: ${itemId}`;
      console.warn(msg);
      return { success: false, message: "Shop item not found or you do not have permission to delete it." };
    }

    // Delete original image and any known convention-based thumbnails.
    // The Resize Images extension might also have a "delete resized images on original delete" option.
    const imageUrlOriginal = itemSnap.data()?.imageUrlOriginal || itemSnap.data()?.imageUrl;
    if (imageUrlOriginal && imageUrlOriginal.includes('firebasestorage.googleapis.com')) {
      try {
        const imageFileRef = storageRef(storage, imageUrlOriginal);
        await deleteObject(imageFileRef);
        console.info(`[deleteShopItem] Successfully deleted original image from storage for itemId: ${itemId}`);
        // TODO: Add logic to delete known thumbnail sizes if URLs are not stored in Firestore
        // e.g., by constructing their paths based on the original and deleting them.
      } catch (storageError: any) {
        if (storageError.code !== 'storage/object-not-found') {
            console.warn(`[deleteShopItem] Error deleting image from storage for itemId: ${itemId}: ${storageError.message}`, storageError);
        } else {
            console.info(`[deleteShopItem] Image not found in storage for itemId: ${itemId}, skipping deletion.`);
        }
      }
    }

    await deleteDoc(itemDocRef);
    console.info(`[deleteShopItem] Successfully deleted itemId: ${itemId} for artistId: ${artistId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[deleteShopItem] Error for artistId: ${artistId}, itemId: ${itemId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to delete shop item: ${errorMessage}` };
  }
}

export async function getArtistShopItems(artistId: string): Promise<ShopItemData[]> {
  if (!artistId) {
    const msg = '[getArtistShopItems] Missing artistId.';
    console.warn(msg);
    return [];
  }
  // console.info(`[getArtistShopItems] Fetching for artistId: ${artistId}`);
  try {
    const q = query(collection(db, 'shopItems'), where("artistId", "==", artistId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            imageUrlOriginal: data.imageUrlOriginal || data.imageUrl, // Fallback
            moderationStatus: data.moderationStatus ?? 'approved',
            moderationInfo: data.moderationInfo ?? null,
        } as ShopItemData
    });
    // console.info(`[getArtistShopItems] Found ${items.length} items for artistId: ${artistId}`);
    return items;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getArtistShopItems] Error fetching items for artistId: ${artistId}: ${errorMessage}`, error);
    return [];
  }
}

export async function getAllShopItems(): Promise<ShopItemData[]> {
  // console.info("[getAllShopItems] Fetching all published shop items.");
  try {
    const q = query(collection(db, 'shopItems'),
                    where("isPublished", "==", true),
                    orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.moderationStatus === 'approved' || data.moderationStatus === undefined) {
            return {
                id: doc.id,
                ...data,
                imageUrlOriginal: data.imageUrlOriginal || data.imageUrl, // Fallback
                moderationStatus: data.moderationStatus ?? 'approved',
                moderationInfo: data.moderationInfo ?? null,
            } as ShopItemData;
        }
        return null;
    }).filter(item => item !== null) as ShopItemData[];
    // console.info(`[getAllShopItems] Found ${items.length} published and approved items.`);
    return items;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getAllShopItems] Error fetching all items: ${errorMessage}`, error);
    return [];
  }
}

export async function getShopItemById(itemId: string): Promise<ShopItemData | null> {
  if (!itemId) {
    const msg = '[getShopItemById] Missing itemId.';
    console.warn(msg);
    return null;
  }
  // console.info(`[getShopItemById] Fetching itemId: ${itemId}`);
  try {
    const itemDocRef = doc(db, 'shopItems', itemId);
    const docSnap = await getDoc(itemDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.isPublished && (data.moderationStatus === 'approved' || data.moderationStatus === undefined)) {
        // console.info(`[getShopItemById] Found published and approved itemId: ${itemId}`);
        return {
            id: docSnap.id,
            ...data,
            imageUrlOriginal: data.imageUrlOriginal || data.imageUrl, // Fallback
            moderationStatus: data.moderationStatus ?? 'approved',
            moderationInfo: data.moderationInfo ?? null,
        } as ShopItemData;
      }
      console.warn(`[getShopItemById] Item ${itemId} found but is not published or not approved. Published: ${data.isPublished}, Moderation: ${data.moderationStatus}`);
      return null;
    } else {
      console.warn(`[getShopItemById] Item not found: ${itemId}`);
    }
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getShopItemById] Error fetching itemId: ${itemId}: ${errorMessage}`, error);
    return null;
  }
}

export async function createOrder(
  orderDetails: Omit<OrderData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; orderId?: string; message?: string }> {
  console.info(`[createOrder] Attempting for userId: ${orderDetails.userId}, checkoutSessionId: ${orderDetails.stripeCheckoutSessionId}`);
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const docRef = await addDoc(ordersCollectionRef, {
      ...orderDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createOrder] Successfully created orderId: ${docRef.id} for userId: ${orderDetails.userId}`);
    return { success: true, orderId: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createOrder] Error for userId: ${orderDetails.userId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create order: ${errorMessage}` };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderData['status'],
  trackingNumber?: string
): Promise<{ success: boolean; message?: string }> {
  if (!orderId) {
    const msg = '[updateOrderStatus] Missing orderId.';
    console.warn(msg);
    return { success: false, message: "Order ID is required." };
  }
  console.info(`[updateOrderStatus] Attempting for orderId: ${orderId}, status: ${status}`);
  const orderDocRef = doc(db, 'orders', orderId);
  try {
    await updateDoc(orderDocRef, {
      status,
      ...(trackingNumber && { trackingNumber }),
      updatedAt: serverTimestamp(),
    });
    console.info(`[updateOrderStatus] Successfully updated orderId: ${orderId} to status: ${status}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[updateOrderStatus] Error for orderId: ${orderId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to update order status: ${errorMessage}` };
  }
}

    