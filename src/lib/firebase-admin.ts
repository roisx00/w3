// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log('Firebase-admin initialized successfully');
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', e);
        }
    } else {
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not found. Server-side admin Firestore will be unavailable.');
    }
}

export const adminDb = getApps().length ? getFirestore() : null as any;
export const adminAuth = getApps().length ? getAuth() : null as any;
