import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Fields to carry over from old Firebase Auth doc (don't overwrite current Privy profile fields)
const MIGRATE_FIELDS = [
    'bio', 'roles', 'skills', 'experience', 'availability',
    'walletAddress', 'socials', 'hasBadge', 'badgeTxHash',
    'cvBoosted', 'cvBoostExpiry', 'bookmarkedJobs', 'trackedAirdrops',
    'savedResumes', 'referredBy', 'referralCode',
];

async function verifyPrivyToken(token: string): Promise<{ did: string; email?: string; twitterUsername?: string } | null> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return null;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}`, 'privy-app-id': appId },
        });
        if (!res.ok) return null;
        const privyUser = await res.json();
        const emailAccount = privyUser.linked_accounts?.find((a: any) => a.type === 'email');
        const twitterAccount = privyUser.linked_accounts?.find((a: any) => a.type === 'twitter_oauth');
        return {
            did: privyUser.id,
            email: emailAccount?.address,
            twitterUsername: twitterAccount?.username,
        };
    } catch {
        return null;
    }
}

async function findOldDoc(did: string, email?: string, twitterUsername?: string, manualUid?: string) {
    const candidates: FirebaseFirestore.QueryDocumentSnapshot[] = [];

    // 1. Manual UID lookup — most precise
    if (manualUid && manualUid !== did) {
        const snap = await adminDb.collection('talents').doc(manualUid).get();
        if (snap.exists) candidates.push(snap as any);
    }

    // 2. Email match
    if (email && candidates.length === 0) {
        const snap = await adminDb.collection('talents').where('email', '==', email).limit(5).get();
        snap.docs.filter(d => d.id !== did && !d.data().migrated).forEach(d => candidates.push(d));
    }

    // 3. Twitter username match (handles @username and username formats)
    if (twitterUsername && candidates.length === 0) {
        const handle = twitterUsername.replace('@', '').toLowerCase();
        const [snap1, snap2] = await Promise.all([
            adminDb.collection('talents').where('socials.twitter', '==', `@${handle}`).limit(3).get(),
            adminDb.collection('talents').where('socials.twitter', '==', handle).limit(3).get(),
        ]);
        [...snap1.docs, ...snap2.docs]
            .filter(d => d.id !== did && !d.data().migrated)
            .forEach(d => { if (!candidates.find(c => c.id === d.id)) candidates.push(d); });
    }

    // 4. Username field match
    if (twitterUsername && candidates.length === 0) {
        const handle = twitterUsername.replace('@', '').toLowerCase();
        const snap = await adminDb.collection('talents').where('username', '==', handle).limit(3).get();
        snap.docs.filter(d => d.id !== did && !d.data().migrated).forEach(d => candidates.push(d));
    }

    return candidates;
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const privyData = await verifyPrivyToken(token);
    if (!privyData) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });

    const { did, email, twitterUsername } = privyData;
    const body = await req.json().catch(() => ({}));
    const manualUid = body.manualUid?.trim() || undefined;

    if (!email && !twitterUsername && !manualUid) {
        return NextResponse.json({
            error: 'No email or Twitter linked to your account. Link your email in Account Settings, or enter your old UID manually.',
        }, { status: 400 });
    }

    try {
        const candidates = await findOldDoc(did, email, twitterUsername, manualUid);

        if (candidates.length === 0) {
            return NextResponse.json({
                found: false,
                message: `No previous account found. Searched by: ${[
                    email && `email (${email})`,
                    twitterUsername && `Twitter (@${twitterUsername})`,
                    manualUid && `UID (${manualUid})`,
                ].filter(Boolean).join(', ')}`,
            });
        }

        // Pick most complete doc
        const bestOldDoc = candidates.sort((a, b) => Object.keys(b.data()).length - Object.keys(a.data()).length)[0];
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
            return NextResponse.json({ found: true, merged: 0, message: 'Your current profile already has all the data from the old account.' });
        }

        await currentRef.set(merged, { merge: true });
        await bestOldDoc.ref.set({ migrated: did, migratedAt: new Date() }, { merge: true });

        return NextResponse.json({ found: true, merged: Object.keys(merged).length, fields: Object.keys(merged) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Migration failed' }, { status: 500 });
    }
}
