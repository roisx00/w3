import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/lib/adminAuth';

// Fields that only admin or a user with verified payment can set
const SENSITIVE_FIELDS = new Set(['hasBadge', 'verified', 'kolBoosted', 'kolBoostExpiry', 'badgeTxHash', 'reputationScore', 'reviewCount']);

// All fields a KOL can legitimately have
const ALLOWED_FIELDS = new Set([
    'displayName', 'bio', 'tagline', 'photoUrl', 'walletAddress',
    'niches', 'contentTypes', 'languages', 'platforms', 'campaigns',
    'openToCollabs', 'minBudget', 'totalReach', 'views',
    'hasBadge', 'badgeTxHash', 'verified', 'kolBoosted', 'kolBoostExpiry',
    'reputationScore', 'reviewCount', 'updatedAt', 'createdAt',
]);

function decodePrivyToken(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        return payload.sub || null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, data } = await req.json();
        if (!userId || !data || typeof data !== 'object') {
            return NextResponse.json({ error: 'Missing userId or data' }, { status: 400 });
        }

        // Strip unknown fields
        const sanitized: Record<string, unknown> = {};
        for (const key of Object.keys(data)) {
            if (ALLOWED_FIELDS.has(key)) sanitized[key] = data[key];
        }

        const hasSensitive = Object.keys(sanitized).some(k => SENSITIVE_FIELDS.has(k));

        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        const isAdmin = token ? await verifyAdmin(token) : false;
        const callerDid = token ? decodePrivyToken(token) : null;
        const isOwner = callerDid === userId;

        if (hasSensitive) {
            if (!isAdmin) {
                if (!isOwner || !callerDid) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
                // Non-admin setting hasBadge must have valid txHash
                if (sanitized.hasBadge === true) {
                    const txHash = sanitized.badgeTxHash as string | undefined;
                    if (!txHash) {
                        return NextResponse.json({ error: 'Missing payment proof' }, { status: 403 });
                    }
                    if (txHash !== 'promo-free' && !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
                        return NextResponse.json({ error: 'Invalid payment proof format' }, { status: 403 });
                    }
                    if (txHash !== 'promo-free') {
                        const paymentSnap = await adminDb.collection('payments')
                            .where('txHash', '==', txHash)
                            .where('status', '==', 'verified')
                            .limit(1)
                            .get();
                        if (paymentSnap.empty) {
                            return NextResponse.json({ error: 'Payment not verified' }, { status: 403 });
                        }
                    }
                }
            }
        } else {
            if (!callerDid) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (!isOwner && !isAdmin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const ref = adminDb.collection('kols').doc(userId);
        const existing = await ref.get();

        await ref.set({
            ...sanitized,
            updatedAt: FieldValue.serverTimestamp(),
            ...(!existing.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to save' }, { status: 500 });
    }
}
