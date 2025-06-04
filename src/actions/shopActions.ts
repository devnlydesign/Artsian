
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
  imageUrl: string;
  dataAiHint?: string;
  category?: string;
  crystallineBloomId?: string | null; 
  stock?: number | null; 
  isDigital?: boolean; 
  tags?: string[];
  isPublished?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItemData {
  itemId: string;
  name: string;
  priceInCents: number;
  quantity: number;
  imageUrl?: string; 
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
  itemDetails: Omit<ShopItemData, 'id' | 'artistId' | 'createdAt' | 'updatedAt' | 'isPublished'> & {isPublished?: boolean}
): Promise<{ success: boolean; itemId?: string; message?: string }> {
  if (!artistId) {
    console.warn('[createShopItem] Missing artistId.');
    return { success: false, message: "Artist ID is required." };
  }
  if (!itemDetails.name || itemDetails.priceInCents == null || !itemDetails.imageUrl) {
    console.warn(`[createShopItem] Missing required fields for artistId: ${artistId}, name: ${itemDetails.name}`);
    return { success: false, message: "Item name, price, and image URL are required." };
  }
  if (itemDetails.priceInCents < 50) { 
    console.warn(`[createShopItem] Price too low for artistId: ${artistId}, name: ${itemDetails.name}, price: ${itemDetails.priceInCents}`);
    return { success: false, message: "Price must be at least $0.50." };
  }
  console.info(`[createShopItem] Attempting for artistId: ${artistId}, name: ${itemDetails.name}`);

  try {
    const artistProfileDoc = doc(db, 'users', artistId);
    const artistSnap = await getDoc(artistProfileDoc);
    const artistName = artistSnap.exists() ? (artistSnap.data() as UserProfileData).fullName || (artistSnap.data() as UserProfileData).username : "Charis Artist";

    const shopItemsCollectionRef = collection(db, 'shopItems');
    const docRef = await addDoc(shopItemsCollectionRef, {
      ...itemDetails,
      artistId: artistId,
      artistName: artistName,
      isPublished: itemDetails.isPublished ?? true,
      stock: itemDetails.stock ?? null,
      isDigital: itemDetails.isDigital ?? false,
      crystallineBloomId: itemDetails.crystallineBloomId || null,
      tags: itemDetails.tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info(`[createShopItem] Successfully created itemId: ${docRef.id} for artistId: ${artistId}`);
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
  itemDetails: Partial<Omit<ShopItemData, 'id' | 'artistId' | 'createdAt' | 'updatedAt' | 'artistName'>>
): Promise<{ success: boolean; message?: string }> {
  if (!artistId || !itemId) {
    console.warn('[updateShopItem] Missing artistId or itemId.');
    return { success: false, message: "Artist ID and Item ID are required." };
  }
  console.info(`[updateShopItem] Attempting for artistId: ${artistId}, itemId: ${itemId}`);

  const itemDocRef = doc(db, 'shopItems', itemId);
  try {
    const itemSnap = await getDoc(itemDocRef);
    if (!itemSnap.exists() || itemSnap.data()?.artistId !== artistId) {
      console.warn(`[updateShopItem] Item not found or permission denied for artistId: ${artistId}, itemId: ${itemId}`);
      return { success: false, message: "Shop item not found or you do not have permission to update it." };
    }

    await updateDoc(itemDocRef, {
      ...itemDetails,
      updatedAt: serverTimestamp(),
    });
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
    console.warn('[deleteShopItem] Missing artistId or itemId.');
    return { success: false, message: "Artist ID and Item ID are required." };
  }
  console.info(`[deleteShopItem] Attempting for artistId: ${artistId}, itemId: ${itemId}`);

  const itemDocRef = doc(db, 'shopItems', itemId);
  try {
    const itemSnap = await getDoc(itemDocRef);
    if (!itemSnap.exists() || itemSnap.data()?.artistId !== artistId) {
      console.warn(`[deleteShopItem] Item not found or permission denied for artistId: ${artistId}, itemId: ${itemId}`);
      return { success: false, message: "Shop item not found or you do not have permission to delete it." };
    }

    const imageUrl = itemSnap.data()?.imageUrl;
    if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const imageFileRef = storageRef(storage, imageUrl);
        await deleteObject(imageFileRef);
        console.info(`[deleteShopItem] Successfully deleted image from storage for itemId: ${itemId}`);
      } catch (storageError: any) {
        // Do not fail the whole operation if image deletion fails, but log it.
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
    console.warn('[getArtistShopItems] Missing artistId.');
    return [];
  }
  // console.info(`[getArtistShopItems] Fetching for artistId: ${artistId}`);
  try {
    const q = query(collection(db, 'shopItems'), where("artistId", "==", artistId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItemData));
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
    const q = query(collection(db, 'shopItems'), where("isPublished", "==", true), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItemData));
    // console.info(`[getAllShopItems] Found ${items.length} published items.`);
    return items;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getAllShopItems] Error fetching all items: ${errorMessage}`, error);
    return [];
  }
}

export async function getShopItemById(itemId: string): Promise<ShopItemData | null> {
  if (!itemId) {
    console.warn('[getShopItemById] Missing itemId.');
    return null;
  }
  // console.info(`[getShopItemById] Fetching itemId: ${itemId}`);
  try {
    const itemDocRef = doc(db, 'shopItems', itemId);
    const docSnap = await getDoc(itemDocRef);
    if (docSnap.exists() && docSnap.data()?.isPublished) {
      // console.info(`[getShopItemById] Found published itemId: ${itemId}`);
      return { id: docSnap.id, ...docSnap.data() } as ShopItemData;
    }
    if (docSnap.exists() && !docSnap.data()?.isPublished) {
      console.warn(`[getShopItemById] Item found but not published: ${itemId}`);
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
    console.warn('[updateOrderStatus] Missing orderId.');
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
