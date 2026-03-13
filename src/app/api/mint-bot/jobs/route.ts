import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { MintBotJob } from '@/lib/mintBot/types';

// GET  /api/mint-bot/jobs?userId=xxx  — list jobs for user
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const snap = await adminDb
        .collection('mint_bot_jobs')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ jobs });
}

// POST /api/mint-bot/jobs  — create + queue a new sniper job
export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        userId,
        walletId,
        walletAddress,
        contractAddress,
        chainId,
        rpcUrl,
        mintFunction,
        mintAmount,
        mintPrice,
        gasMultiplier,
        maxRetries,
    } = body;

    if (!userId || !walletId || !contractAddress || !rpcUrl) {
        return NextResponse.json(
            { error: 'userId, walletId, contractAddress, and rpcUrl are required.' },
            { status: 400 },
        );
    }

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const now = new Date();
    const jobData: Omit<MintBotJob, 'id'> = {
        userId,
        walletId,
        walletAddress,
        contractAddress: contractAddress.trim().toLowerCase(),
        chainId: Number(chainId) || 8453,
        rpcUrl,
        mintFunction: mintFunction || 'mint',
        mintAmount: Number(mintAmount) || 1,
        mintPrice: mintPrice || '0',
        gasMultiplier: Number(gasMultiplier) || 1.2,
        maxRetries: Number(maxRetries) || 3,
        status: 'monitoring',
        createdAt: now,
        updatedAt: now,
    };

    const doc = await adminDb.collection('mint_bot_jobs').add(jobData);
    return NextResponse.json({ id: doc.id, ...jobData });
}

// PATCH /api/mint-bot/jobs?id=xxx  — stop or update a job
export async function PATCH(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const { status, userId } = await req.json();

    const docRef = adminDb.collection('mint_bot_jobs').doc(id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.userId !== userId) {
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    await docRef.update({ status, updatedAt: new Date() });
    return NextResponse.json({ ok: true });
}
