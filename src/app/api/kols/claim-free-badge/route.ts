import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkKolBadgePromo } from '@/lib/promos';

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

    const promo = await checkKolBadgePromo();
    if (!promo.isFree) {
        return NextResponse.json({ error: 'Launch promo has ended. KOL badge costs $5 USDC.' }, { status: 400 });
    }

    const kolRef = adminDb.collection('kols').doc(did);
    const kolSnap = await kolRef.get();
    if (kolSnap.exists && kolSnap.data()?.hasBadge) {
        return NextResponse.json({ error: 'You already have a KOL badge.' }, { status: 400 });
    }

    await kolRef.set(
        { hasBadge: true, hasBadgePending: false, badgeTxHash: 'promo-free', updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
    );

    await adminDb.collection('payments').add({
        userId: did,
        userEmail: '',
        userDisplayName: kolSnap.data()?.displayName || '',
        type: 'kol_badge',
        amount: 0,
        txHash: 'promo-free',
        status: 'verified',
        note: 'First 50 launch promo',
        createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
}
