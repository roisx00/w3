import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

function getFirebaseApp(): FirebaseApp {
    if (getApps().length > 0) return getApp();
    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase API key is not configured.");
    }
    return initializeApp(firebaseConfig);
}

let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebaseAuth(): Auth {
    if (!_auth) _auth = getAuth(getFirebaseApp());
    return _auth;
}

export function getFirebaseDb(): Firestore {
    if (!_db) _db = getFirestore(getFirebaseApp());
    return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
    if (!_storage) _storage = getStorage(getFirebaseApp());
    return _storage;
}

// Lazy singletons — safe for static prerendering
export const auth = new Proxy({} as Auth, {
    get(_, prop) {
        return (getFirebaseAuth() as unknown as Record<string | symbol, unknown>)[prop];
    }
});

export const db = new Proxy({} as Firestore, {
    get(_, prop) {
        return (getFirebaseDb() as unknown as Record<string | symbol, unknown>)[prop];
    }
});

export const storage = new Proxy({} as FirebaseStorage, {
    get(_, prop) {
        return (getFirebaseStorage() as unknown as Record<string | symbol, unknown>)[prop];
    }
});
