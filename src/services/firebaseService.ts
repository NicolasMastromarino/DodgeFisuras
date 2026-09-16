import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { Hotspot } from '../types';
import { INITIAL_HOTSPOTS } from '../data/hotspots';
import configJson from '../../firebase-applet-config.json';

// Use config from firebase-applet-config.json or environment variables as fallback
const firebaseConfig = {
  apiKey: configJson.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: configJson.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: configJson.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: configJson.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: configJson.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: configJson.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, configJson.firestoreDatabaseId || '(default)');

const HOTSPOTS_COLLECTION = 'hotspots';

/**
 * Subscribe to real-time community hotspots from Firestore.
 * Automatically handles offline fallback and merging with initial curated hotspots.
 */
export function subscribeToHotspots(
  onUpdate: (hotspots: Hotspot[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const colRef = collection(db, HOTSPOTS_COLLECTION);
    const q = query(colRef, limit(300));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // If the Firestore collection is completely empty, provide initial seed spots
          onUpdate(INITIAL_HOTSPOTS);
          return;
        }

        const remoteHotspots: Hotspot[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Hotspot;
          remoteHotspots.push({
            ...data,
            id: docSnap.id,
          });
        });

        // Merge: Community reports on top, plus initial seed spots that aren't overwritten
        const remoteIds = new Set(remoteHotspots.map((h) => h.id));
        const missingInitial = INITIAL_HOTSPOTS.filter((h) => !remoteIds.has(h.id));

        // Sort so newest community reports come first
        const combined = [...remoteHotspots, ...missingInitial];
        onUpdate(combined);
      },
      (error) => {
        console.warn('Firestore snapshot listener warning (using local/fallback data):', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up Firestore listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save a new hotspot report to Firestore so everyone sees it immediately.
 */
export async function saveHotspotToFirestore(hotspot: Hotspot): Promise<void> {
  try {
    const docRef = doc(db, HOTSPOTS_COLLECTION, hotspot.id);
    await setDoc(docRef, {
      ...hotspot,
      createdAt: new Date().toISOString(),
      isCommunityReported: true,
    });
  } catch (error) {
    console.error('Failed to save hotspot to Firestore:', error);
    throw error;
  }
}

/**
 * Increment the confirmed counter (+1) for a dangerous spot across all users.
 */
export async function confirmHotspotInFirestore(hotspotId: string): Promise<void> {
  try {
    const docRef = doc(db, HOTSPOTS_COLLECTION, hotspotId);
    await updateDoc(docRef, {
      confirmedCount: increment(1),
    });
  } catch (error) {
    console.warn('Could not increment confirmedCount in Firestore (might be static seed):', error);
  }
}
