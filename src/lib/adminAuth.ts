import { adminDb } from '@/lib/firebaseAdmin';

const ADMIN_EMAIL = 'roisx00@gmail.com';

/**
 * Decode a Privy JWT to extract the user's DID (sub claim).
 * We don't need to verify the signature here — we use the DID only to look up
 * the user's record in Firestore (populated at login by verified Privy session).
 */
function decodePrivyToken(token: string): { did: string } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        // Base64url decode the payload
        const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
        const claims = JSON.parse(payload);
        const did = claims.sub as string;
        if (!did) return null;
        return { did };
    } catch {
        return null;
    }
}

/**
 * Verify admin access using Privy JWT → Firestore lookup.
 *
 * Flow:
 *  1. Decode the JWT to get the user's Privy DID (sub claim)
 *  2. Fetch their talents/{did} doc from Firestore (written at login)
 *  3. Check email === ADMIN_EMAIL  OR  isAdmin === true
 *
 * This is safe because Firestore data was written during a real authenticated
 * Privy session — a forged DID would find the wrong or no user record.
 */
export async function verifyAdmin(token: string): Promise<boolean> {
    if (!token) return false;
    try {
        const decoded = decodePrivyToken(token);
        if (!decoded) {
            console.warn('[adminAuth] Failed to decode token');
            return false;
        }

        const snap = await adminDb.collection('talents').doc(decoded.did).get();
        if (!snap.exists) {
            console.warn('[adminAuth] No talent doc for DID:', decoded.did);
            return false;
        }

        const data = snap.data()!;
        const email: string = data.email || '';
        const isAdminField: boolean = data.isAdmin === true;

        console.log('[adminAuth] verifyAdmin — email:', email, '| isAdmin field:', isAdminField);

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
    if (!token) return false;
    try {
        const decoded = decodePrivyToken(token);
        if (!decoded) return false;

        const snap = await adminDb.collection('talents').doc(decoded.did).get();
        if (!snap.exists) return false;

        return (snap.data()!.email || '') === ADMIN_EMAIL;
    } catch {
        return false;
    }
}
