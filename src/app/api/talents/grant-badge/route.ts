import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkBadgePromo } from '@/lib/promos';

async function verifyPrivyToken(token: string): Promise<{ did: string } | null> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return null;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}`, 'privy-app-id': appId },
        });
        if (!res.ok) return null;
        const privyUser = await res.json();
        return { did: privyUser.id };
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

    const { did } = privyData;

    // Check promo still active
    const promo = await checkBadgePromo();
    if (!promo.isFree) {
        return NextResponse.json({ error: 'Launch promo has ended. Badge costs $2 USDC.' }, { status: 400 });
    }

    // Check not already badged
    const talentRef = adminDb.collection('talents').doc(did);
    const talentSnap = await talentRef.get();
    if (talentSnap.exists && talentSnap.data()?.hasBadge) {
        return NextResponse.json({ error: 'You already have a badge.' }, { status: 400 });
    }

    // Grant badge
    await talentRef.set({ hasBadge: true, hasBadgePending: false, badgeTxHash: 'promo-free' }, { merge: true });

    // Log payment record
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
