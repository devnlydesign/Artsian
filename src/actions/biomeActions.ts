
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
  setDoc,
} from 'firebase/firestore';

export interface BiomeData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  imageUrl?: string;
  dataAiHint?: string;
  memberCount: number;
  accessType: 'free' | 'paid'; // 'free' or 'paid'
  stripePriceId?: string | null; // For 'paid' biomes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BiomeMembershipData {
  id: string; // e.g., `${userId}_${biomeId}`
  userId: string;
  biomeId: string;
  role: 'owner' | 'member' | 'admin'; // 'owner', 'admin', 'member'
  joinedAt: Timestamp;
  status?: 'active' | 'pending_payment' | 'cancelled'; // For paid biomes
}

// Firestore Security Rules Reminder:
// match /biomes/{biomeId} {
//   allow read: if true; // Or more specific, e.g., if resource.data.accessType == 'free' || isBiomeMember(biomeId)
//   allow create: if request.auth != null && request.auth.uid == request.resource.data.creatorId;
//   allow update: if request.auth != null && request.auth.uid == resource.data.creatorId; // Or biome admins
// }
// match /biomeMemberships/{membershipId} {
//   allow read: if request.auth != null && (request.auth.uid == resource.data.userId || isBiomeAdmin(resource.data.biomeId));
//   allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//   allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
// }

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
    // For now, we'll allow creating paid biomes without a priceId as a placeholder.
    // In a full implementation, this might be an error or require Stripe product setup first.
    console.warn("Creating a 'paid' biome without a Stripe Price ID. Full payment functionality will require this.");
  }

  try {
    const biomesCollectionRef = collection(db, 'biomes');
    const docRef = await addDoc(biomesCollectionRef, {
      name,
      description,
      creatorId,
      creatorName,
      imageUrl,
      dataAiHint,
      memberCount: 1, // Creator is the first member
      accessType,
      stripePriceId: accessType === 'paid' ? stripePriceId || null : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Add creator as the first member and owner
    const membershipRef = doc(db, 'biomeMemberships', `${creatorId}_${docRef.id}`);
    await setDoc(membershipRef, {
      userId: creatorId,
      biomeId: docRef.id,
      role: 'owner',
      joinedAt: serverTimestamp(),
      status: 'active',
    });

    return { success: true, biomeId: docRef.id };
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
  biomeId: string
): Promise<{ success: boolean; message?: string; requiresPayment?: boolean }> {
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

    if (membershipSnap.exists()) {
      return { success: false, message: "User is already a member of this biome." };
    }

    if (biome.accessType === 'paid') {
      // Placeholder for Stripe integration.
      // In a real app, this would initiate a Stripe Checkout session.
      // For now, we'll just indicate payment is required.
      console.log(`User ${userId} attempting to join paid biome ${biomeId}. Stripe integration needed.`);
      return { success: false, message: "This is a paid biome. Payment functionality is not yet implemented.", requiresPayment: true };
    }

    // For 'free' biomes:
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
    
    // Prevent owner from leaving directly, they might need to transfer ownership or delete biome
    if (membershipSnap.data()?.role === 'owner') {
        const biome = await getBiomeById(biomeId);
        if (biome && biome.memberCount > 1) {
             return { success: false, message: "Owner cannot leave a biome with other members. Transfer ownership or manage members first." };
        }
        // If owner is the last member, deleting the membership could orphan the biome.
        // Consider logic for biome deletion if owner leaves and is last member.
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

// Placeholder for future biome post actions
// export async function createBiomePost(...) {}
// export async function getBiomePosts(...) {}
