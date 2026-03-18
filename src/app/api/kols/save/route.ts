import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const ADMIN_DID = process.env.NEXT_PUBLIC_ADMIN_UID || 'cmmutno61018m0dlb7p754q7c';

// Fields that only the admin or a user with verified payment can set
const SENSITIVE_FIELDS = new Set(['hasBadge', 'verified', 'kolBoosted', 'kolBoostExpiry', 'badgeTxHash', 'reputationScore', 'reviewCount']);

// All fields a KOL can legitimately have
const ALLOWED_FIELDS = new Set([
    'displayName', 'bio', 'tagline', 'photoUrl', 'walletAddress',
    'niches', 'contentTypes', 'languages', 'platforms', 'campaigns',
    'openToCollabs', 'minBudget', 'totalReach', 'views',
    'hasBadge', 'badgeTxHash', 'verified', 'kolBoosted', 'kolBoostExpiry',
    'reputationScore', 'reviewCount', 'updatedAt', 'createdAt',
]);

async function verifyPrivyToken(token: string): Promise<string | null> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return null;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'privy-app-id': appId,
            },
        });
        if (!res.ok) return null;
        const user = await res.json();
        return (user.id as string) || null;
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

        // Strip unknown fields to prevent arbitrary data injection
        const sanitized: Record<string, unknown> = {};
        for (const key of Object.keys(data)) {
            if (ALLOWED_FIELDS.has(key)) sanitized[key] = data[key];
        }

        const hasSensitive = Object.keys(sanitized).some(k => SENSITIVE_FIELDS.has(k));

        // Verify caller identity via Privy token
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const callerDID = token ? await verifyPrivyToken(token) : null;
        const isAdmin = callerDID === ADMIN_DID;
        const isOwner = callerDID === userId;

        if (hasSensitive) {
            if (!isAdmin) {
                // Non-admins can only set badge on their own profile, and only with valid payment proof
                if (!isOwner) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
                // If setting hasBadge, require a txHash
                if (sanitized.hasBadge === true) {
                    const txHash = sanitized.badgeTxHash as string | undefined;
                    if (!txHash) {
                        return NextResponse.json({ error: 'Missing payment proof' }, { status: 403 });
                    }
                    if (txHash !== 'promo-free' && !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
                        return NextResponse.json({ error: 'Invalid payment proof format' }, { status: 403 });
                    }
                    // For non-promo: ensure the txHash exists as a verified payment
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
            // Regular profile update — require authenticated owner or admin
            if (!callerDID) {
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
