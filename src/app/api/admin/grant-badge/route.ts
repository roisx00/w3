import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
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
