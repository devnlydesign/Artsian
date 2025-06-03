'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  writeBatch,
  increment,
  deleteDoc,
  orderBy,
  setDoc as firestoreSetDoc, // Renamed to avoid conflict with local setDoc
} from 'firebase/firestore';
import { createSubscriptionCheckoutSession } from './stripe'; // Import for paid biomes
import type { UserProfileData } from './userProfile'; // For user details

export interface BiomeData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  imageUrl?: string;
  dataAiHint?: string;
  memberCount: number;
  accessType: 'free' | 'paid'; 
  stripePriceId?: string | null; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BiomeMembershipData {
  id: string; 
  userId: string;
  biomeId: string;
  role: 'owner' | 'member' | 'admin'; 
  joinedAt: Timestamp;
  status?: 'active' | 'pending_payment' | 'cancelled' | 'incomplete'; // For paid biomes
  stripeSubscriptionId?: string | null; // For tracking Stripe subscription
  stripeCurrentPeriodEnd?: Timestamp | null; // For subscription validity
}

export async function createBiome(
  creatorId: string,
  creatorName: string,
  name: string,
  description: string,
  accessType: 'free' | 'paid',
  imageUrl: string = "https://placehold.co/400x200.png",
  dataAiHint: string = "private community abstract",
  stripePriceId?: string
): Promise<{ success: boolean; biomeId?: string; message?: string }> {
  if (!creatorId || !name || !description) {
    return { success: false, message: "Creator ID, name, and description are required." };
  }
  if (accessType === 'paid' && !stripePriceId) {
    return { success: false, message: "A Stripe Price ID is required for paid biomes." };
  }

  try {
    const biomesCollectionRef = collection(db, 'biomes');
    const newBiomeDocRef = await addDoc(biomesCollectionRef, {
      name,
      description,
      creatorId,
      creatorName,
      imageUrl,
      dataAiHint,
      memberCount: 1, 
      accessType,
      stripePriceId: accessType === 'paid' ? stripePriceId : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const membershipRef = doc(db, 'biomeMemberships', `${creatorId}_${newBiomeDocRef.id}`);
    await firestoreSetDoc(membershipRef, {
      userId: creatorId,
      biomeId: newBiomeDocRef.id,
      role: 'owner',
      joinedAt: serverTimestamp(),
      status: 'active', 
    });

    return { success: true, biomeId: newBiomeDocRef.id };
  } catch (error) {
    console.error("Error creating biome: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create biome: ${errorMessage}` };
  }
}

export async function getAllBiomes(): Promise<BiomeData[]> {
  try {
    const biomesCollectionRef = collection(db, 'biomes');
    const q = query(biomesCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const biomes: BiomeData[] = [];
    querySnapshot.forEach((doc) => {
      biomes.push({ id: doc.id, ...doc.data() } as BiomeData);
    });
    return biomes;
  } catch (error) {
    console.error("Error fetching all biomes: ", error);
    return [];
  }
}

export async function getBiomeById(biomeId: string): Promise<BiomeData | null> {
  if (!biomeId) return null;
  try {
    const biomeDocRef = doc(db, 'biomes', biomeId);
    const docSnap = await getDoc(biomeDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BiomeData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching biome by ID:", error);
    return null;
  }
}

export async function joinBiome(
  userId: string,
  userEmail: string | undefined | null,
  userName: string | undefined | null,
  biomeId: string
): Promise<{ success: boolean; message?: string; sessionId?: string; requiresPayment?: boolean }> {
  if (!userId || !biomeId) {
    return { success: false, message: "User ID and Biome ID are required." };
  }

  try {
    const biome = await getBiomeById(biomeId);
    if (!biome) {
      return { success: false, message: "Biome not found." };
    }

    const membershipId = `${userId}_${biomeId}`;
    const membershipDocRef = doc(db, 'biomeMemberships', membershipId);
    const membershipSnap = await getDoc(membershipDocRef);

    if (membershipSnap.exists() && membershipSnap.data()?.status === 'active') {
      return { success: false, message: "User is already an active member of this biome." };
    }

    if (biome.accessType === 'paid') {
      if (!biome.stripePriceId) {
        return { success: false, message: "This paid biome is missing a Stripe Price ID. Cannot process payment." };
      }
      // For paid biomes, initiate Stripe Checkout
      const checkoutResult = await createSubscriptionCheckoutSession(
        userId,
        userEmail,
        userName,
        biome.stripePriceId,
        biomeId
      );

      if ('error' in checkoutResult) {
        return { success: false, message: checkoutResult.error, requiresPayment: true };
      }
      // Optionally, create a 'pending_payment' membership record here, or let webhook handle it.
      // For now, we let webhook create the membership.
      return { success: true, sessionId: checkoutResult.sessionId, requiresPayment: true };

    } else { // For 'free' biomes:
      const batch = writeBatch(db);
      batch.set(membershipDocRef, {
        userId,
        biomeId,
        role: 'member',
        joinedAt: serverTimestamp(),
        status: 'active',
      });

      const biomeDocRef = doc(db, 'biomes', biomeId);
      batch.update(biomeDocRef, {
        memberCount: increment(1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      return { success: true, message: "Successfully joined biome." };
    }
  } catch (error) {
    console.error("Error joining biome: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to join biome: ${errorMessage}` };
  }
}

export async function leaveBiome(
  userId: string,
  biomeId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !biomeId) {
    return { success: false, message: "User ID and Biome ID are required." };
  }

  try {
    const membershipId = `${userId}_${biomeId}`;
    const membershipDocRef = doc(db, 'biomeMemberships', membershipId);
    const membershipSnap = await getDoc(membershipDocRef);

    if (!membershipSnap.exists()) {
      return { success: false, message: "User is not a member of this biome." };
    }
    
    const membershipData = membershipSnap.data() as BiomeMembershipData;
    if (membershipData.role === 'owner') {
        const biome = await getBiomeById(biomeId);
        if (biome && biome.memberCount > 1) {
             return { success: false, message: "Owner cannot leave a biome with other members. Transfer ownership or manage members first." };
        }
    }

    // If it was a paid biome, you might need to cancel the Stripe subscription here
    // or handle it via a separate "manage subscription" flow.
    // For simplicity, this example just removes the Firestore record.
    // A webhook for `customer.subscription.deleted` should also handle membership status changes.
    if (membershipData.stripeSubscriptionId) {
        console.warn(`User ${userId} leaving biome ${biomeId} with active subscription ${membershipData.stripeSubscriptionId}. Subscription should be cancelled in Stripe.`);
        // Ideally: await stripe.subscriptions.update(membershipData.stripeSubscriptionId, { cancel_at_period_end: true });
        // Or: await stripe.subscriptions.del(membershipData.stripeSubscriptionId);
        // For now, we'll just log a warning and proceed with Firestore deletion.
    }


    const batch = writeBatch(db);
    batch.delete(membershipDocRef);

    const biomeDocRef = doc(db, 'biomes', biomeId);
    batch.update(biomeDocRef, {
      memberCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return { success: true, message: "Successfully left biome." };
  } catch (error) {
    console.error("Error leaving biome: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to leave biome: ${errorMessage}` };
  }
}

export async function getUserBiomeMemberships(userId: string): Promise<BiomeMembershipData[]> {
  if (!userId) return [];
  try {
    const membershipsCollectionRef = collection(db, 'biomeMemberships');
    const q = query(membershipsCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const memberships: BiomeMembershipData[] = [];
    querySnapshot.forEach((doc) => {
      memberships.push({ id: doc.id, ...doc.data() } as BiomeMembershipData);
    });
    return memberships;
  } catch (error) {
    console.error("Error fetching user biome memberships:", error);
    return [];
  }
}

export async function isUserMemberOfBiome(userId: string, biomeId: string): Promise<boolean> {
  if (!userId || !biomeId) return false;
  try {
    const membershipId = `${userId}_${biomeId}`;
    const membershipDocRef = doc(db, 'biomeMemberships', membershipId);
    const docSnap = await getDoc(membershipDocRef);
    return docSnap.exists() && docSnap.data()?.status === 'active';
  } catch (error) {
    console.error("Error checking biome membership:", error);
    return false;
  }
}