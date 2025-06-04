
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
  setDoc as firestoreSetDoc, 
} from 'firebase/firestore';
import { createSubscriptionCheckoutSession } from './stripe'; 
import type { UserProfileData } from './userProfile'; 

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
  status?: 'active' | 'pending_payment' | 'cancelled' | 'incomplete'; 
  stripeSubscriptionId?: string | null; 
  stripeCurrentPeriodEnd?: Timestamp | null; 
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
    console.warn(`[createBiome] Missing required fields. creatorId: ${creatorId}, name: ${name}`);
    return { success: false, message: "Creator ID, name, and description are required." };
  }
  if (accessType === 'paid' && !stripePriceId) {
    console.warn(`[createBiome] Paid biome requires Stripe Price ID. Name: ${name}`);
    return { success: false, message: "A Stripe Price ID is required for paid biomes." };
  }
  console.info(`[createBiome] Attempting for creatorId: ${creatorId}, name: ${name}, access: ${accessType}`);

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
    console.info(`[createBiome] Successfully created biomeId: ${newBiomeDocRef.id} by creatorId: ${creatorId}`);
    return { success: true, biomeId: newBiomeDocRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[createBiome] Error for creatorId: ${creatorId}, name: ${name}: ${errorMessage}`, error);
    return { success: false, message: `Failed to create biome: ${errorMessage}` };
  }
}

export async function getAllBiomes(): Promise<BiomeData[]> {
  // console.info("[getAllBiomes] Fetching all biomes."); // Can be noisy
  try {
    const biomesCollectionRef = collection(db, 'biomes');
    const q = query(biomesCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const biomes: BiomeData[] = [];
    querySnapshot.forEach((doc) => {
      biomes.push({ id: doc.id, ...doc.data() } as BiomeData);
    });
    // console.info(`[getAllBiomes] Found ${biomes.length} biomes.`);
    return biomes;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getAllBiomes] Error: ${errorMessage}`, error);
    return [];
  }
}

export async function getBiomeById(biomeId: string): Promise<BiomeData | null> {
  if (!biomeId) {
    console.warn('[getBiomeById] Missing biomeId.');
    return null;
  }
  // console.info(`[getBiomeById] Fetching biomeId: ${biomeId}`);
  try {
    const biomeDocRef = doc(db, 'biomes', biomeId);
    const docSnap = await getDoc(biomeDocRef);
    if (docSnap.exists()) {
      // console.info(`[getBiomeById] Found biomeId: ${biomeId}`);
      return { id: docSnap.id, ...docSnap.data() } as BiomeData;
    }
    console.warn(`[getBiomeById] Biome not found: ${biomeId}`);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getBiomeById] Error fetching biomeId: ${biomeId}: ${errorMessage}`, error);
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
    console.warn(`[joinBiome] Missing userId or biomeId. userId: ${userId}, biomeId: ${biomeId}`);
    return { success: false, message: "User ID and Biome ID are required." };
  }
  console.info(`[joinBiome] Attempting for userId: ${userId} to join biomeId: ${biomeId}`);

  try {
    const biome = await getBiomeById(biomeId);
    if (!biome) {
      console.warn(`[joinBiome] Biome not found: ${biomeId}`);
      return { success: false, message: "Biome not found." };
    }

    const membershipId = `${userId}_${biomeId}`;
    const membershipDocRef = doc(db, 'biomeMemberships', membershipId);
    const membershipSnap = await getDoc(membershipDocRef);

    if (membershipSnap.exists() && membershipSnap.data()?.status === 'active') {
      console.info(`[joinBiome] User ${userId} is already an active member of biome ${biomeId}.`);
      return { success: false, message: "User is already an active member of this biome." };
    }

    if (biome.accessType === 'paid') {
      if (!biome.stripePriceId) {
        console.error(`[joinBiome] Paid biome ${biomeId} is missing Stripe Price ID.`);
        return { success: false, message: "This paid biome is missing a Stripe Price ID. Cannot process payment." };
      }
      console.info(`[joinBiome] Paid biome ${biomeId}. Initiating Stripe checkout for user ${userId}.`);
      const checkoutResult = await createSubscriptionCheckoutSession(
        userId,
        userEmail,
        userName,
        biome.stripePriceId,
        biomeId
      );

      if ('error' in checkoutResult) {
        console.warn(`[joinBiome] Stripe checkout session creation failed for user ${userId}, biome ${biomeId}: ${checkoutResult.error}`);
        return { success: false, message: checkoutResult.error, requiresPayment: true };
      }
      console.info(`[joinBiome] Stripe session created for user ${userId}, biome ${biomeId}. SessionId: ${checkoutResult.sessionId}`);
      return { success: true, sessionId: checkoutResult.sessionId, requiresPayment: true };

    } else { // For 'free' biomes:
      console.info(`[joinBiome] Free biome ${biomeId}. Adding user ${userId} as member.`);
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
      console.info(`[joinBiome] User ${userId} successfully joined free biome ${biomeId}.`);
      return { success: true, message: "Successfully joined biome." };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[joinBiome] Error for userId: ${userId}, biomeId: ${biomeId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to join biome: ${errorMessage}` };
  }
}

export async function leaveBiome(
  userId: string,
  biomeId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId || !biomeId) {
    console.warn(`[leaveBiome] Missing userId or biomeId. userId: ${userId}, biomeId: ${biomeId}`);
    return { success: false, message: "User ID and Biome ID are required." };
  }
  console.info(`[leaveBiome] Attempting for userId: ${userId} to leave biomeId: ${biomeId}`);

  try {
    const membershipId = `${userId}_${biomeId}`;
    const membershipDocRef = doc(db, 'biomeMemberships', membershipId);
    const membershipSnap = await getDoc(membershipDocRef);

    if (!membershipSnap.exists()) {
      console.warn(`[leaveBiome] User ${userId} is not a member of biome ${biomeId}.`);
      return { success: false, message: "User is not a member of this biome." };
    }
    
    const membershipData = membershipSnap.data() as BiomeMembershipData;
    if (membershipData.role === 'owner') {
        const biome = await getBiomeById(biomeId);
        if (biome && biome.memberCount > 1) {
            console.warn(`[leaveBiome] Owner ${userId} cannot leave biome ${biomeId} with other members.`);
             return { success: false, message: "Owner cannot leave a biome with other members. Transfer ownership or manage members first." };
        }
    }
    
    if (membershipData.stripeSubscriptionId) {
        console.warn(`[leaveBiome] User ${userId} leaving biome ${biomeId} with active subscription ${membershipData.stripeSubscriptionId}. Subscription should be cancelled in Stripe.`);
    }

    const batch = writeBatch(db);
    batch.delete(membershipDocRef);

    const biomeDocRef = doc(db, 'biomes', biomeId);
    batch.update(biomeDocRef, {
      memberCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    console.info(`[leaveBiome] User ${userId} successfully left biome ${biomeId}.`);
    return { success: true, message: "Successfully left biome." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[leaveBiome] Error for userId: ${userId}, biomeId: ${biomeId}: ${errorMessage}`, error);
    return { success: false, message: `Failed to leave biome: ${errorMessage}` };
  }
}

export async function getUserBiomeMemberships(userId: string): Promise<BiomeMembershipData[]> {
  if (!userId) {
    console.warn('[getUserBiomeMemberships] Missing userId.');
    return [];
  }
  // console.info(`[getUserBiomeMemberships] Fetching for userId: ${userId}`);
  try {
    const membershipsCollectionRef = collection(db, 'biomeMemberships');
    const q = query(membershipsCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const memberships: BiomeMembershipData[] = [];
    querySnapshot.forEach((doc) => {
      memberships.push({ id: doc.id, ...doc.data() } as BiomeMembershipData);
    });
    // console.info(`[getUserBiomeMemberships] Found ${memberships.length} memberships for userId: ${userId}`);
    return memberships;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getUserBiomeMemberships] Error fetching memberships for userId: ${userId}: ${errorMessage}`, error);
    return [];
  }
}

export async function isUserMemberOfBiome(userId: string, biomeId: string): Promise<boolean> {
  if (!userId || !biomeId) {
    // console.warn(`[isUserMemberOfBiome] Missing userId or biomeId. userId: ${userId}, biomeId: ${biomeId}`);
    return false;
  }
  // console.info(`[isUserMemberOfBiome] Checking for userId: ${userId}, biomeId: ${biomeId}`);
  try {
    const membershipId = `${userId}_${biomeId}`;
    const membershipDocRef = doc(db, 'biomeMemberships', membershipId);
    const docSnap = await getDoc(membershipDocRef);
    const isMember = docSnap.exists() && docSnap.data()?.status === 'active';
    // console.info(`[isUserMemberOfBiome] Membership status for userId: ${userId}, biomeId: ${biomeId}: ${isMember}`);
    return isMember;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[isUserMemberOfBiome] Error checking membership for userId: ${userId}, biomeId: ${biomeId}: ${errorMessage}`, error);
    return false;
  }
}
