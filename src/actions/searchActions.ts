
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  getDocs,
  limit,
} from 'firebase/firestore';
import type { UserProfileData } from './userProfile';
import type { ArtworkData } from './artworkActions';

// Basic Search: Users by Name or Username (Starts With)
export async function searchUsersByNameOrUsername(
  searchText: string,
  count: number = 10
): Promise<UserProfileData[]> {
  if (!searchText || searchText.trim() === '') {
    console.warn('[searchUsersByNameOrUsername] Search text is empty.');
    return [];
  }
  const normalizedSearchText = searchText.toLowerCase(); // Normalize for case-insensitive-like search (requires lowercase fields)
  console.info(`[searchUsersByNameOrUsername] Searching for users matching: "${normalizedSearchText}"`);

  // Firestore does not support case-insensitive "starts-with" queries directly on mixed-case fields.
  // For a true case-insensitive starts-with, you'd need to store a lowercase version of fullName and username.
  // This example performs two separate prefix queries and merges results.
  // It's still case-sensitive for the prefix part.
  
  const users: UserProfileData[] = [];
  const foundUserIds = new Set<string>();

  try {
    // Search by username (prefix, case-sensitive)
    const usernameQuery = query(
      collection(db, 'users'),
      orderBy('username'),
      where('moderationStatus', '==', 'approved'), // Only show approved profiles
      startAt(searchText),
      endAt(searchText + '\uf8ff'), // '\uf8ff' is a high Unicode character for prefix matching
      limit(count)
    );
    const usernameSnap = await getDocs(usernameQuery);
    usernameSnap.forEach(doc => {
      if (!foundUserIds.has(doc.id)) {
        users.push({ uid: doc.id, ...doc.data() } as UserProfileData);
        foundUserIds.add(doc.id);
      }
    });

    // Search by fullName (prefix, case-sensitive) - if we still need more results
    if (users.length < count) {
      const fullNameQuery = query(
        collection(db, 'users'),
        orderBy('fullName'),
        where('moderationStatus', '==', 'approved'),
        startAt(searchText),
        endAt(searchText + '\uf8ff'),
        limit(count - users.length)
      );
      const fullNameSnap = await getDocs(fullNameQuery);
      fullNameSnap.forEach(doc => {
        if (!foundUserIds.has(doc.id)) {
          users.push({ uid: doc.id, ...doc.data() } as UserProfileData);
          foundUserIds.add(doc.id);
        }
      });
    }
    
    // console.info(`[searchUsersByNameOrUsername] Found ${users.length} users for query: "${searchText}"`);
    return users;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[searchUsersByNameOrUsername] Error searching for users: "${searchText}": ${errorMessage}`, error);
    return [];
  }
}

// Basic Search: Artworks by Title (Starts With)
export async function searchArtworksByTitle(
  searchText: string,
  count: number = 10
): Promise<ArtworkData[]> {
  if (!searchText || searchText.trim() === '') {
    console.warn('[searchArtworksByTitle] Search text is empty.');
    return [];
  }
  console.info(`[searchArtworksByTitle] Searching for artworks matching: "${searchText}"`);
  
  // Similar to user search, this is case-sensitive for the prefix.
  // For true case-insensitive search, store a lowercase version of the title.
  try {
    const artworksQuery = query(
      collection(db, 'artworks'),
      orderBy('title'),
      where('moderationStatus', '==', 'approved'), // Only show approved artworks
      where('isPublished', '==', true), // Only published artworks
      startAt(searchText),
      endAt(searchText + '\uf8ff'),
      limit(count)
    );
    const querySnapshot = await getDocs(artworksQuery);
    const artworks: ArtworkData[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ArtworkData));
    // console.info(`[searchArtworksByTitle] Found ${artworks.length} artworks for query: "${searchText}"`);
    return artworks;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[searchArtworksByTitle] Error searching for artworks: "${searchText}": ${errorMessage}`, error);
    return [];
  }
}

/**
 * NOTE ON ADVANCED SEARCH:
 * Firestore's querying capabilities are powerful for structured data but limited for full-text search,
 * typo tolerance, relevance ranking, and complex faceting.
 *
 * For a production application requiring robust search, consider integrating a dedicated search service:
 * 1. Algolia: Popular, feature-rich, provides Firebase Extensions for easy integration.
 * 2. Typesense: Open-source, fast, also has Firebase Extensions.
 * 3. Elasticsearch: Powerful but can be complex to manage.
 *
 * Integration typically involves:
 * - Using Firebase Cloud Functions (triggered on Firestore document writes) to index your data
 *   (users, artworks, communities, shop items, etc.) into the search service.
 * - Your client application would then query the search service directly (or via a server action proxy)
 *   to get search results (usually a list of document IDs).
 * - You would then fetch the full documents from Firestore using these IDs.
 */
