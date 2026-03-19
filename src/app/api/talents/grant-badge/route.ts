import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkBadgePromo } from '@/lib/promos';

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

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const did = decodePrivyToken(token);
    if (!did) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });

    const promo = await checkBadgePromo();
    if (!promo.isFree) {
        return NextResponse.json({ error: 'Launch promo has ended. Badge costs $2 USDC.' }, { status: 400 });
    }

    const talentRef = adminDb.collection('talents').doc(did);
    const talentSnap = await talentRef.get();
    if (talentSnap.exists && talentSnap.data()?.hasBadge) {
        return NextResponse.json({ error: 'You already have a badge.' }, { status: 400 });
    }

    await talentRef.set({ hasBadge: true, hasBadgePending: false, badgeTxHash: 'promo-free' }, { merge: true });

    await adminDb.collection('payments').add({
        userId: did,
        userEmail: talentSnap.data()?.email || '',
        userDisplayName: talentSnap.data()?.displayName || '',
        type: 'user_badge',
        amount: 0,
        txHash: 'promo-free',
        status: 'verified',
        note: 'First 50 launch promo',
        createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
}
