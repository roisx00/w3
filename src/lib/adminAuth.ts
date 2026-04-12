import { adminAuth } from '@/lib/firebase-admin';
import { adminDb } from '@/lib/firebaseAdmin';

const ADMIN_EMAIL = 'roisx00@gmail.com';

/**
 * Verify admin access using a Firebase ID token.
 * Flow:
 *  1. Verify the Firebase ID token with Firebase Admin SDK
 *  2. Extract the uid (e.g. 'tw_1234567890')
 *  3. Fetch their talents/{uid} doc and check email === ADMIN_EMAIL or isAdmin === true
 */
export async function verifyAdmin(token: string): Promise<boolean> {
    if (!token || !adminAuth) return false;
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        const snap = await adminDb.collection('talents').doc(uid).get();
        if (!snap.exists) {
            console.warn('[adminAuth] No talent doc for uid:', uid);
            return false;
        }

        const data = snap.data()!;
        const email: string = data.email || '';
        const isAdminField: boolean = data.isAdmin === true;

        console.log('[adminAuth] verifyAdmin — uid:', uid, '| email:', email, '| isAdmin:', isAdminField);
        return email === ADMIN_EMAIL || isAdminField;
    } catch (err) {
        console.error('[adminAuth] verifyAdmin error:', err);
        return false;
    }
}

/**
 * Primary admin only (by email). Used for granting/revoking admin access.
 */
export async function verifyPrimaryAdmin(token: string): Promise<boolean> {
    if (!token || !adminAuth) return false;
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        const snap = await adminDb.collection('talents').doc(decoded.uid).get();
        if (!snap.exists) return false;
        return (snap.data()!.email || '') === ADMIN_EMAIL;
    } catch {
        return false;
    }
}
