import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

const ALLOWED_COLLECTIONS = new Set([
    'talents', 'kols', 'jobs', 'airdrops', 'payments', 'kol_proposals', 'applications', 'referrals'
]);

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { collection, id } = await req.json();
    if (!collection || !id) return NextResponse.json({ error: 'Missing collection or id' }, { status: 400 });
    if (!ALLOWED_COLLECTIONS.has(collection)) return NextResponse.json({ error: 'Collection not allowed' }, { status: 400 });

    await adminDb.collection(collection).doc(id).delete();
    return NextResponse.json({ success: true });
}
