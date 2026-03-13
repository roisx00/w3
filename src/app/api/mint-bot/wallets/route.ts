import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { encryptPrivateKey } from '@/lib/mintBot/encryption';
import { MintBotWallet } from '@/lib/mintBot/types';
import { ethers } from 'ethers';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// GET  /api/mint-bot/wallets?userId=xxx  — list wallets (addresses only, no keys)
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const snap = await adminDb
        .collection('mint_bot_wallets')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const wallets = snap.docs.map((d: QueryDocumentSnapshot) => {
        const data = d.data() as MintBotWallet;
        // Never return the encrypted key to the frontend
        return { id: d.id, name: data.name, address: data.address, createdAt: data.createdAt };
    });

    return NextResponse.json({ wallets });
}

// POST /api/mint-bot/wallets  — add a wallet
export async function POST(req: NextRequest) {
    const { userId, name, privateKey } = await req.json();

    if (!userId || !name || !privateKey) {
        return NextResponse.json({ error: 'userId, name, and privateKey are required.' }, { status: 400 });
    }

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    // Verify user has Golden Badge
    const userDoc = await adminDb.collection('talents').doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.hasBadge) {
        return NextResponse.json({ error: 'Golden Badge required to use Mint Bot.' }, { status: 403 });
    }

    // Enforce wallet limit
    const existingSnap = await adminDb.collection('mint_bot_wallets').where('userId', '==', userId).get();
    if (existingSnap.size >= 3) {
        return NextResponse.json({ error: 'Maximum 3 wallets allowed per account.' }, { status: 429 });
    }

    // Validate private key is a valid Ethereum key
    try {
        new ethers.Wallet(privateKey);
    } catch {
        return NextResponse.json({ error: 'Invalid private key.' }, { status: 400 });
    }

    const wallet = new ethers.Wallet(privateKey);
    const { encrypted, iv, tag } = encryptPrivateKey(privateKey);

    const doc = await adminDb.collection('mint_bot_wallets').add({
        userId,
        name,
        address: wallet.address,
        encryptedKey: encrypted,
        iv,
        tag,
        createdAt: new Date(),
    });

    return NextResponse.json({ id: doc.id, address: wallet.address, name });
}

// DELETE /api/mint-bot/wallets?id=xxx&userId=xxx  — remove a wallet
export async function DELETE(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    const userId = req.nextUrl.searchParams.get('userId');
    if (!id || !userId) return NextResponse.json({ error: 'id and userId required' }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const docRef = adminDb.collection('mint_bot_wallets').doc(id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.userId !== userId) {
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ ok: true });
}
