import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { supabase } from '@/lib/supabase';
import { encryptPrivateKey } from '@/lib/mintBot/encryption';
import { ethers } from 'ethers';

// GET  /api/mint-bot/wallets?userId=xxx  — list wallets
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const { data: wallets, error } = await supabase
        .from('wallets')
        .select('id, name, address, created_at')
        .eq('firebase_user_id', userId);

    if (error) {
        console.error('[supabase-error]', error);
        return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
    }

    // Map snake_case to camelCase for frontend
    const mappedWallets = wallets.map((w: any) => ({
        id: w.id,
        name: w.name,
        address: w.address,
        createdAt: w.created_at
    }));

    return NextResponse.json({ wallets: mappedWallets });
}

// POST /api/mint-bot/wallets  — add a wallet
export async function POST(req: NextRequest) {
    const { userId, name, privateKey } = await req.json();

    if (!userId || !name || !privateKey) {
        return NextResponse.json({ error: 'userId, name, and privateKey are required.' }, { status: 400 });
    }

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    // Verify user has Golden Badge (Keep Firebase for Auth/Talents)
    const userDoc = await adminDb.collection('talents').doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.hasBadge) {
        return NextResponse.json({ error: 'Golden Badge required to use Mint Bot.' }, { status: 403 });
    }

    // Enforce strict wallet limit (max 3)
    const { count, error: countError } = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true })
        .eq('firebase_user_id', userId);
        
    if (countError) {
        return NextResponse.json({ error: 'Failed to verify wallet count' }, { status: 500 });
    }
        
    if (count && count >= 3) {
        return NextResponse.json(
            { error: 'Maximum 3 wallets allowed.' }, 
            { status: 429 }
        );
    }

    // Validate private key
    let wallet;
    try {
        wallet = new ethers.Wallet(privateKey);
    } catch {
        return NextResponse.json({ error: 'Invalid private key.' }, { status: 400 });
    }

    const { encrypted, iv, tag } = encryptPrivateKey(privateKey);

    const { data, error: insertError } = await supabase
        .from('wallets')
        .insert({
            firebase_user_id: userId,
            name,
            address: wallet.address,
            encrypted_key: encrypted,
            iv,
            tag,
        })
        .select()
        .single();

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, address: wallet.address, name: data.name });
}

// DELETE /api/mint-bot/wallets?id=xxx&userId=xxx  — remove a wallet
export async function DELETE(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    const userId = req.nextUrl.searchParams.get('userId');
    if (!id || !userId) return NextResponse.json({ error: 'id and userId required' }, { status: 400 });

    const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id)
        .eq('firebase_user_id', userId);

    if (error) {
        return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
