import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

function serializeDoc(doc: FirebaseFirestore.QueryDocumentSnapshot) {
    const data = doc.data();
    const out: Record<string, unknown> = { id: doc.id };
    for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && 'toDate' in val) {
            out[key] = (val as FirebaseFirestore.Timestamp).toDate().toISOString();
        } else {
            out[key] = val;
        }
    }
    return out;
}

export async function GET(req: NextRequest) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    try {
        const [jobsSnap, airdropsSnap, paymentsSnap, proposalsSnap, kolsSnap, talentsSnap] = await Promise.all([
            adminDb.collection('jobs').orderBy('createdAt', 'desc').get(),
            adminDb.collection('airdrops').orderBy('createdAt', 'desc').get(),
            adminDb.collection('payments').orderBy('createdAt', 'desc').get(),
            adminDb.collection('kol_proposals').orderBy('createdAt', 'desc').get(),
            adminDb.collection('kols').get(),
            adminDb.collection('talents').get(),
        ]);

        return NextResponse.json({
            jobs: jobsSnap.docs.map(serializeDoc),
            airdrops: airdropsSnap.docs.map(serializeDoc),
            payments: paymentsSnap.docs.map(serializeDoc),
            proposals: proposalsSnap.docs.map(serializeDoc),
            kols: kolsSnap.docs.map(serializeDoc),
            talents: talentsSnap.docs.map(serializeDoc),
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Fetch failed' }, { status: 500 });
    }
}
