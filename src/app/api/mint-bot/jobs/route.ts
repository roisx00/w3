import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { supabase } from '@/lib/supabase';

const MAX_ACTIVE_JOBS = 2;
const MAX_RETRIES_CAP = 5;

// Default RPCs resolved server-side
const DEFAULT_RPCS: Record<number, string> = {
    1:     process.env.DEFAULT_ETH_RPC      || 'https://eth.llamarpc.com',
    8453:  process.env.DEFAULT_BASE_RPC     || 'https://mainnet.base.org',
    137:   process.env.DEFAULT_POLYGON_RPC  || 'https://polygon.llamarpc.com',
    42161: process.env.DEFAULT_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
};

// GET  /api/mint-bot/jobs?userId=xxx
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const { data: jobs, error } = await supabase
        .from('mint_jobs')
        .select('*')
        .eq('firebase_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Map snake_case to camelCase for frontend
    const mappedJobs = jobs.map((j: any) => ({
        id: j.id,
        userId: j.firebase_user_id,
        walletId: j.wallet_id,
        walletAddress: j.wallet_address,
        contractAddress: j.contract_address,
        chainId: j.chain_id,
        rpcUrl: j.rpc_url,
        mintFunction: j.mint_function,
        mintAmount: j.mint_amount,
        mintPrice: j.mint_price,
        gasMultiplier: j.gas_multiplier,
        maxRetries: j.max_retries,
        status: j.status,
        txHash: j.tx_hash,
        error: j.error_message,
        createdAt: j.created_at,
        updatedAt: j.updated_at
    }));

    return NextResponse.json({ jobs: mappedJobs });
}

// POST /api/mint-bot/jobs
export async function POST(req: NextRequest) {
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

    // Verify wallet ownership in Supabase
    const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('address')
        .eq('id', walletId)
        .eq('firebase_user_id', userId)
        .single();

    if (walletError || !wallet) {
        return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    // Enforce active job limit
    const { count, error: countError } = await supabase
        .from('mint_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('firebase_user_id', userId)
        .in('status', ['monitoring', 'minting']);

    if (countError) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }

    if (count && count >= MAX_ACTIVE_JOBS) {
        return NextResponse.json(
            { error: `Limit reached. Maximum ${MAX_ACTIVE_JOBS} active snipers allowed.` },
            { status: 429 },
        );
    }

    const chain = Number(chainId) || 8453;
    const resolvedRpc = rpcUrl?.trim() || DEFAULT_RPCS[chain] || 'https://mainnet.base.org';

    const { data: job, error: insertError } = await supabase
        .from('mint_jobs')
        .insert({
            firebase_user_id: userId,
            wallet_id: walletId,
            wallet_address: walletAddress,
            contract_address: contractAddress.trim().toLowerCase(),
            chain_id: chain,
            rpc_url: resolvedRpc,
            mint_function: mintFunction || 'mint',
            mint_amount: Number(mintAmount) || 1,
            mint_price: mintPrice || '0',
            gas_multiplier: Number(gasMultiplier) || 1.2,
            max_retries: Math.min(Number(maxRetries) || 3, MAX_RETRIES_CAP),
            status: 'monitoring',
        })
        .select()
        .single();

    const mappedJob = {
        id: job.id,
        userId: job.firebase_user_id,
        walletId: job.wallet_id,
        walletAddress: job.wallet_address,
        contractAddress: job.contract_address,
        chainId: job.chain_id,
        rpcUrl: job.rpc_url,
        mintFunction: job.mint_function,
        mintAmount: job.mint_amount,
        mintPrice: job.mint_price,
        gasMultiplier: job.gas_multiplier,
        maxRetries: job.max_retries,
        status: job.status,
        txHash: job.tx_hash,
        error: job.error_message,
        createdAt: job.created_at,
        updatedAt: job.updated_at
    };

    return NextResponse.json(mappedJob);
}

// PATCH /api/mint-bot/jobs?id=xxx
export async function PATCH(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { status, userId } = await req.json();

    const { error } = await supabase
        .from('mint_jobs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('firebase_user_id', userId);

    if (error) {
        return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
