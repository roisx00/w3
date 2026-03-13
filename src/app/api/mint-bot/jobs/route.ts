import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { MintBotJob } from '@/lib/mintBot/types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const MAX_ACTIVE_JOBS = 2;
const MAX_RETRIES_CAP = 5;

// Default RPCs resolved server-side — never sent to the frontend
const DEFAULT_RPCS: Record<number, string> = {
    1:     process.env.DEFAULT_ETH_RPC      || 'https://eth.llamarpc.com',
    8453:  process.env.DEFAULT_BASE_RPC     || 'https://mainnet.base.org',
    137:   process.env.DEFAULT_POLYGON_RPC  || 'https://polygon.llamarpc.com',
    42161: process.env.DEFAULT_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
};

// Strip rpcUrl before returning to frontend
function sanitizeJob(id: string, data: Record<string, unknown>) {
    const { rpcUrl: _rpc, ...safe } = data;
    return { id, ...safe };
}

// GET  /api/mint-bot/jobs?userId=xxx
export async function GET(req: NextRequest) {
    return NextResponse.json({ error: 'Mint Bot is temporarily disabled for maintenance.' }, { status: 503 });
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const snap = await adminDb
        .collection('mint_bot_jobs')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

    const jobs = snap.docs.map((d: QueryDocumentSnapshot) =>
        sanitizeJob(d.id, d.data() as Record<string, unknown>)
    );
    return NextResponse.json({ jobs });
}

// POST /api/mint-bot/jobs
export async function POST(req: NextRequest) {
    return NextResponse.json({ error: 'Mint Bot is temporarily disabled for maintenance.' }, { status: 503 });
    const body = await req.json();
    const {
        userId, walletId, walletAddress, contractAddress,
        chainId, rpcUrl, mintFunction, mintAmount,
        mintPrice, gasMultiplier, maxRetries,
    } = body;

    if (!userId || !walletId || !contractAddress) {
        return NextResponse.json(
            { error: 'userId, walletId, and contractAddress are required.' },
            { status: 400 },
        );
    }

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    // Verify Golden Badge
    const userDoc = await adminDb.collection('talents').doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.hasBadge) {
        return NextResponse.json({ error: 'Golden Badge required to use Mint Bot.' }, { status: 403 });
    }

    // Verify wallet ownership
    const walletDoc = await adminDb.collection('mint_bot_wallets').doc(walletId).get();
    if (!walletDoc.exists || walletDoc.data()?.userId !== userId) {
        return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    // Enforce active job limit
    const activeSnap = await adminDb
        .collection('mint_bot_jobs')
        .where('userId', '==', userId)
        .where('status', 'in', ['monitoring', 'minting'])
        .get();
    if (activeSnap.size >= MAX_ACTIVE_JOBS) {
        return NextResponse.json(
            { error: `Limit reached. Maximum ${MAX_ACTIVE_JOBS} active snipers allowed. Stop another job to continue.` },
            { status: 429 },
        );
    }

    // Resolve RPC server-side — user's custom URL takes priority, fallback to W3Hub default
    const chain = Number(chainId) || 8453;
    const resolvedRpc = rpcUrl?.trim() || DEFAULT_RPCS[chain] || 'https://mainnet.base.org';

    const now = new Date();
    const jobData: Omit<MintBotJob, 'id'> = {
        userId,
        walletId,
        walletAddress,
        contractAddress: contractAddress.trim().toLowerCase(),
        chainId: chain,
        rpcUrl: resolvedRpc,   // stored server-side only
        mintFunction: mintFunction || 'mint',
        mintAmount: Number(mintAmount) || 1,
        mintPrice: mintPrice || '0',
        gasMultiplier: Number(gasMultiplier) || 1.2,
        maxRetries: Math.min(Number(maxRetries) || 3, MAX_RETRIES_CAP),
        status: 'monitoring',
        createdAt: now,
        updatedAt: now,
    };

    const doc = await adminDb.collection('mint_bot_jobs').add(jobData);
    return NextResponse.json(sanitizeJob(doc.id, jobData as unknown as Record<string, unknown>));
}

// PATCH /api/mint-bot/jobs?id=xxx
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
