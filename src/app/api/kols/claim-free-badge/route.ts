import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkKolBadgePromo } from '@/lib/promos';

async function verifyPrivyToken(token: string): Promise<string | null> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return null;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}`, 'privy-app-id': appId },
        });
        if (!res.ok) return null;
        const user = await res.json();
        return (user.id as string) || null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const did = await verifyPrivyToken(token);
    if (!did) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });

    // Check promo still active
    const promo = await checkKolBadgePromo();
    if (!promo.isFree) {
        return NextResponse.json({ error: 'Launch promo has ended. KOL badge costs $5 USDC.' }, { status: 400 });
    }

    // Check not already badged
    const kolRef = adminDb.collection('kols').doc(did);
    const kolSnap = await kolRef.get();
    if (kolSnap.exists && kolSnap.data()?.hasBadge) {
        return NextResponse.json({ error: 'You already have a KOL badge.' }, { status: 400 });
    }

    // Grant badge — create or update the KOL doc
    await kolRef.set(
        { hasBadge: true, hasBadgePending: false, badgeTxHash: 'promo-free', updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
    );

    // Log payment record
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
