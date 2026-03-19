import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const MIGRATE_FIELDS = [
    'bio', 'roles', 'skills', 'experience', 'availability',
    'walletAddress', 'socials', 'hasBadge', 'badgeTxHash',
    'cvBoosted', 'cvBoostExpiry', 'bookmarkedJobs', 'trackedAirdrops',
    'savedResumes', 'referredBy', 'referralCode',
];

function decodePrivyToken(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        return payload.sub || null;
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

    // 3. Twitter username match
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

    const did = decodePrivyToken(token);
    if (!did) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });

    // Get user data from Firestore (populated at login)
    const talentSnap = await adminDb.collection('talents').doc(did).get();
    const talentData = talentSnap.exists ? talentSnap.data()! : {};
    const email: string = talentData.email || '';
    const twitterUsername: string = talentData.username || '';

    const body = await req.json().catch(() => ({}));
    const manualUid = body.manualUid?.trim() || undefined;

    if (!email && !twitterUsername && !manualUid) {
        return NextResponse.json({
            error: 'No email or Twitter linked to your account. Enter your old UID manually.',
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

        const bestOldDoc = candidates.sort((a, b) => Object.keys(b.data()).length - Object.keys(a.data()).length)[0];
        const oldData = bestOldDoc.data();
        const currentData = talentData;

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

        await adminDb.collection('talents').doc(did).set(merged, { merge: true });
        await bestOldDoc.ref.set({ migrated: did, migratedAt: new Date() }, { merge: true });

        return NextResponse.json({ found: true, merged: Object.keys(merged).length, fields: Object.keys(merged) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Migration failed' }, { status: 500 });
    }
}
