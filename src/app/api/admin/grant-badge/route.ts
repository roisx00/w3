import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const ADMIN_DID = process.env.NEXT_PUBLIC_ADMIN_UID || 'cmmutno61018m0dlb7p754q7c';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'roisx00@gmail.com';

async function verifyAdmin(token: string): Promise<boolean> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return false;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}`, 'privy-app-id': appId },
        });
        if (!res.ok) return false;
        const privyUser = await res.json();
        const emailAccount = privyUser.linked_accounts?.find((a: any) => a.type === 'email');
        return privyUser.id === ADMIN_DID || emailAccount?.address === ADMIN_EMAIL;
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { targetId, type, txHash } = await req.json();
    if (!targetId || !type) return NextResponse.json({ error: 'Missing targetId or type' }, { status: 400 });

    const tx = txHash || 'admin-grant';

    if (type === 'resume') {
        const ref = adminDb.collection('talents').doc(targetId);
        const snap = await ref.get();
        await ref.set({ hasBadge: true, hasBadgePending: false, badgeTxHash: tx }, { merge: true });
        await adminDb.collection('payments').add({
            userId: targetId,
            userEmail: snap.data()?.email || '',
            userDisplayName: snap.data()?.displayName || '',
            type: 'user_badge', amount: 0, txHash: tx,
            status: 'verified', note: 'Manually granted by admin',
            createdAt: FieldValue.serverTimestamp(),
        });
    } else if (type === 'kol') {
        const ref = adminDb.collection('kols').doc(targetId);
        const snap = await ref.get();
        if (!snap.exists) return NextResponse.json({ error: 'No KOL profile found for that ID' }, { status: 404 });
        await ref.set({ hasBadge: true, hasBadgePending: false, badgeTxHash: tx }, { merge: true });
        await adminDb.collection('payments').add({
            userId: targetId,
            userEmail: '', userDisplayName: snap.data()?.displayName || '',
            type: 'kol_badge', amount: 0, txHash: tx,
            status: 'verified', note: 'Manually granted by admin',
            createdAt: FieldValue.serverTimestamp(),
        });
    } else {
        return NextResponse.json({ error: 'Unknown badge type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
