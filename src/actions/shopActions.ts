
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
  artistId: string; // Firebase UID of the artist selling the item
  artistName?: string; // Denormalized for easier display
  name: string;
  description: string;
  priceInCents: number; // Store price in cents to avoid floating point issues
  imageUrl: string;
  dataAiHint?: string;
  category?: string;
  crystallineBloomId?: string | null; // Optional: Link to a specific Crystalline Bloom
  stock?: number | null; // For physical items, null if infinite/digital
  isDigital?: boolean; // True if the item is a digital good
  // digitalFileUrl?: string; // Consider secure delivery for digital goods later
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
  imageUrl?: string; // Snapshot of image at time of purchase
  crystallineBloomId?: string | null;
}

export interface OrderData {
  id: string;
  userId: string; // Buyer's Firebase UID
  userEmail?: string; // Buyer's email (optional, if captured)
  items: OrderItemData[];
  totalAmountInCents: number;
  status: 'pending' | 'paid' | 'shipped' | 'fulfilled' | 'cancelled' | 'refunded';
  stripeCheckoutSessionId: string;
  shippingAddress?: any; // Consider a structured address object
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Future: artistId if multi-vendor, trackingNumber, etc.
}

// --- Shop Item Management ---

export async function createShopItem(
  artistId: string,
  itemDetails: Omit<ShopItemData, 'id' | 'artistId' | 'createdAt' | 'updatedAt' | 'isPublished'> & {isPublished?: boolean}
): Promise<{ success: boolean; itemId?: string; message?: string }> {
  if (!artistId) {
    return { success: false, message: "Artist ID is required." };
  }
  if (!itemDetails.name || itemDetails.priceInCents == null || !itemDetails.imageUrl) {
    return { success: false, message: "Item name, price, and image URL are required." };
  }
  if (itemDetails.priceInCents < 50) { // Minimum 50 cents for Stripe
    return { success: false, message: "Price must be at least $0.50." };
  }

  try {
    // Fetch artist's name for denormalization
    const artistProfile = doc(db, 'users', artistId);
    const artistSnap = await getDoc(artistProfile);
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
    return { success: true, itemId: docRef.id };
  } catch (error) {
    console.error("Error creating shop item: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create shop item: ${errorMessage}` };
  }
}

export async function updateShopItem(
  artistId: string,
  itemId: string,
  itemDetails: Partial<Omit<ShopItemData, 'id' | 'artistId' | 'createdAt' | 'updatedAt' | 'artistName'>>
): Promise<{ success: boolean; message?: string }> {
  if (!artistId || !itemId) {
    return { success: false, message: "Artist ID and Item ID are required." };
  }

  const itemDocRef = doc(db, 'shopItems', itemId);
  try {
    const itemSnap = await getDoc(itemDocRef);
    if (!itemSnap.exists() || itemSnap.data()?.artistId !== artistId) {
      return { success: false, message: "Shop item not found or you do not have permission to update it." };
    }

    await updateDoc(itemDocRef, {
      ...itemDetails,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating shop item: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to update shop item: ${errorMessage}` };
  }
}

export async function deleteShopItem(
  artistId: string,
  itemId: string
): Promise<{ success: boolean; message?: string }> {
  if (!artistId || !itemId) {
    return { success: false, message: "Artist ID and Item ID are required." };
  }

  const itemDocRef = doc(db, 'shopItems', itemId);
  try {
    const itemSnap = await getDoc(itemDocRef);
    if (!itemSnap.exists() || itemSnap.data()?.artistId !== artistId) {
      return { success: false, message: "Shop item not found or you do not have permission to delete it." };
    }

    // Optional: Delete associated image from Firebase Storage
    // const imageUrl = itemSnap.data()?.imageUrl;
    // if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
    //   try {
    //     const imageFileRef = storageRef(storage, imageUrl);
    //     await deleteObject(imageFileRef);
    //   } catch (storageError) {
    //     console.warn("Error deleting image from storage:", storageError);
    //     // Don't fail the whole operation if image deletion fails, but log it.
    //   }
    // }

    await deleteDoc(itemDocRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting shop item: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to delete shop item: ${errorMessage}` };
  }
}

export async function getArtistShopItems(artistId: string): Promise<ShopItemData[]> {
  if (!artistId) return [];
  try {
    const q = query(collection(db, 'shopItems'), where("artistId", "==", artistId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItemData));
  } catch (error) {
    console.error("Error fetching artist shop items: ", error);
    return [];
  }
}

export async function getAllShopItems(): Promise<ShopItemData[]> {
  try {
    const q = query(collection(db, 'shopItems'), where("isPublished", "==", true), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItemData));
  } catch (error) {
    console.error("Error fetching all shop items: ", error);
    return [];
  }
}

export async function getShopItemById(itemId: string): Promise<ShopItemData | null> {
  if (!itemId) return null;
  try {
    const itemDocRef = doc(db, 'shopItems', itemId);
    const docSnap = await getDoc(itemDocRef);
    if (docSnap.exists() && docSnap.data()?.isPublished) {
      return { id: docSnap.id, ...docSnap.data() } as ShopItemData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching shop item by ID:", error);
    return null;
  }
}


// --- Order Management (Primarily for Webhook to use) ---
// These actions are more for illustrating data structure and potential webhook interaction
// rather than direct client-side invocation for order creation.

export async function createOrder(
  orderDetails: Omit<OrderData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; orderId?: string; message?: string }> {
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const docRef = await addDoc(ordersCollectionRef, {
      ...orderDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Error creating order: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create order: ${errorMessage}` };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderData['status'],
  trackingNumber?: string
): Promise<{ success: boolean; message?: string }> {
  if (!orderId) {
    return { success: false, message: "Order ID is required." };
  }
  const orderDocRef = doc(db, 'orders', orderId);
  try {
    await updateDoc(orderDocRef, {
      status,
      ...(trackingNumber && { trackingNumber }), // Example for adding tracking
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating order status: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to update order status: ${errorMessage}` };
  }
}

// Firestore Security Rules Reminder:
// /shopItems/{itemId}:
//   allow read: if resource.data.isPublished == true || request.auth.uid == resource.data.artistId;
//   allow create: if request.auth.uid == request.resource.data.artistId;
//   allow update, delete: if request.auth.uid == resource.data.artistId;
//
// /orders/{orderId}:
//   allow read: if request.auth.uid == resource.data.userId; // Or artistId, or admin
//   allow create, update, delete: if false; // Only server/webhook
//
// /users/{userId}/privateShopItems/{itemId} (if you want private/draft items not in main 'shopItems')
//   allow read, write: if request.auth.uid == userId;

// Stripe Webhook (in your Cloud Function) should handle:
// - Verifying `checkout.session.completed` for mode 'payment'.
// - Retrieving `itemId`, `userId` from session metadata.
// - Fetching ShopItemData to get price, name, etc.
// - Calling `createOrder`.
// - If physical item, decrementing `stock` on `ShopItemData` (atomically).
// - If digital item, triggering secure delivery mechanism.
// - Sending notifications to buyer and seller.
