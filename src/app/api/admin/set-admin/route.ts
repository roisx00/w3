import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyPrimaryAdmin } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isPrimary = await verifyPrimaryAdmin(token);
    if (!isPrimary) return NextResponse.json({ error: 'Only the primary admin can grant admin access' }, { status: 403 });

    const { targetId, revoke } = await req.json();
    if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });

    await adminDb.collection('talents').doc(targetId).set(
        { isAdmin: revoke ? false : true },
        { merge: true }
    );

    return NextResponse.json({ success: true, isAdmin: !revoke });
}
