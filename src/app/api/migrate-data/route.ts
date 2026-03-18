import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Fields to carry over from old Firebase Auth doc (don't overwrite current Privy profile fields)
const MIGRATE_FIELDS = [
    'bio', 'roles', 'skills', 'experience', 'availability',
    'walletAddress', 'socials', 'hasBadge', 'badgeTxHash',
    'cvBoosted', 'cvBoostExpiry', 'bookmarkedJobs', 'trackedAirdrops',
    'savedResumes', 'referredBy', 'referralCode',
];

async function verifyPrivyToken(token: string): Promise<{ did: string; email?: string } | null> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return null;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}`, 'privy-app-id': appId },
        });
        if (!res.ok) return null;
        const privyUser = await res.json();
        const emailAccount = privyUser.linked_accounts?.find((a: any) => a.type === 'email');
        return { did: privyUser.id, email: emailAccount?.address };
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const privyData = await verifyPrivyToken(token);
    if (!privyData) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });

    const { did, email } = privyData;
    if (!email) {
        return NextResponse.json({ error: 'No verified email linked to your account. Link your email in Account Settings first.' }, { status: 400 });
    }

    try {
        // Find old doc by email (could be Firebase Auth era doc)
        const oldSnap = await adminDb.collection('talents')
            .where('email', '==', email)
            .limit(5)
            .get();

        // Filter out the current user's own doc
        const oldDocs = oldSnap.docs.filter(d => d.id !== did);
        if (oldDocs.length === 0) {
            return NextResponse.json({ found: false, message: 'No previous account found with that email.' });
        }

        // Pick the most complete doc (most fields filled)
        const bestOldDoc = oldDocs.sort((a, b) => Object.keys(b.data()).length - Object.keys(a.data()).length)[0];
        const oldData = bestOldDoc.data();

        // Get current doc
        const currentRef = adminDb.collection('talents').doc(did);
        const currentSnap = await currentRef.get();
        const currentData = currentSnap.exists ? currentSnap.data()! : {};

        // Merge: carry over old fields only if current field is empty/missing
        const merged: Record<string, unknown> = {};
        for (const field of MIGRATE_FIELDS) {
            const oldVal = oldData[field];
            const newVal = currentData[field];
            const isEmpty = newVal === undefined || newVal === null || newVal === '' ||
                (Array.isArray(newVal) && newVal.length === 0);
            if (isEmpty && oldVal !== undefined && oldVal !== null) {
                merged[field] = oldVal;
            }
        }

        if (Object.keys(merged).length === 0) {
            return NextResponse.json({ found: true, merged: 0, message: 'Your current profile already has all data — nothing to restore.' });
        }

        // Write merged fields into current (Privy) doc
        await currentRef.set(merged, { merge: true });
        // Mark old doc as migrated so it won't be matched again
        await bestOldDoc.ref.set({ migrated: did, migratedAt: new Date() }, { merge: true });

        return NextResponse.json({ found: true, merged: Object.keys(merged).length, fields: Object.keys(merged) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Migration failed' }, { status: 500 });
    }
}
