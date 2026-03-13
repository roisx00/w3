import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// GET /api/mint-bot/logs?jobId=xxx  — stream recent logs for a job
export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const snap = await adminDb
        .collection('mint_bot_logs')
        .where('jobId', '==', jobId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

    const logs = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ logs });
}
