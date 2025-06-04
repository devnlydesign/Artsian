
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, Timestamp, orderBy } from 'firebase/firestore';

export interface LegalDocumentData {
  id: string; // e.g., "termsOfService", "privacyPolicy"
  title: string;
  version: string;
  content: string; // Can be HTML, Markdown, or plain text
  lastUpdatedAt: Timestamp;
}

/**
 * Fetches a specific legal document by its ID.
 * @param documentId The ID of the legal document (e.g., "termsOfService").
 * @returns The legal document data or null if not found.
 */
export async function getLegalDocument(documentId: string): Promise<LegalDocumentData | null> {
  if (!documentId) {
    console.warn('[getLegalDocument] Document ID is required.');
    return null;
  }
  console.info(`[getLegalDocument] Fetching legal document: ${documentId}`);
  try {
    const docRef = doc(db, 'LegalDocuments', documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.info(`[getLegalDocument] Found legal document: ${documentId}`);
      return { id: docSnap.id, ...docSnap.data() } as LegalDocumentData;
    } else {
      console.warn(`[getLegalDocument] No legal document found with ID: ${documentId}`);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getLegalDocument] Error fetching document ${documentId}: ${errorMessage}`, error);
    return null;
  }
}

/**
 * Fetches all legal documents from the LegalDocuments collection.
 * @returns An array of legal documents.
 */
export async function getAllLegalDocuments(): Promise<LegalDocumentData[]> {
  console.info('[getAllLegalDocuments] Fetching all legal documents.');
  try {
    const legalDocsCollectionRef = collection(db, 'LegalDocuments');
    // Optionally order by a field, e.g., title or lastUpdatedAt
    const q = query(legalDocsCollectionRef, orderBy('title', 'asc'));
    const querySnapshot = await getDocs(q);

    const documents: LegalDocumentData[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as LegalDocumentData);
    });
    console.info(`[getAllLegalDocuments] Found ${documents.length} legal documents.`);
    return documents;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`[getAllLegalDocuments] Error fetching documents: ${errorMessage}`, error);
    return [];
  }
}

// Note: Functions to create/update legal documents (e.g., createLegalDocument, updateLegalDocument)
// would typically be restricted to admin users and might be part of a separate admin interface
// or managed directly in the Firestore console by authorized personnel.
// Example (conceptual - requires admin role check):
/*
export async function updateLegalDocument(documentId: string, data: Partial<Omit<LegalDocumentData, 'id' | 'lastUpdatedAt'>>)
  : Promise<{ success: boolean; message?: string }> {
  // TODO: Implement robust admin role check here
  // if (!isUserAdmin(request.auth.uid)) { return { success: false, message: "Unauthorized" }; }
  
  console.info(`[updateLegalDocument] Attempting to update: ${documentId}`);
  try {
    const docRef = doc(db, 'LegalDocuments', documentId);
    await updateDoc(docRef, {
      ...data,
      lastUpdatedAt: serverTimestamp(),
    });
    return { success: true, message: `Document ${documentId} updated.` };
  } catch (error) {
    // ... error handling ...
    return { success: false, message: `Failed to update document: ${error.message}` };
  }
}
*/
