import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const ADMIN_DID = process.env.NEXT_PUBLIC_ADMIN_UID || 'cmmutno61018m0dlb7p754q7c';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'roisx00@gmail.com';

async function verifyOwner(token: string): Promise<boolean> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return false;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}`, 'privy-app-id': appId },
        });
        if (!res.ok) return false;
        const user = await res.json();
        const emailAccount = user.linked_accounts?.find((a: any) => a.type === 'email');
        return user.id === ADMIN_DID || emailAccount?.address === ADMIN_EMAIL;
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isOwner = await verifyOwner(token);
    if (!isOwner) return NextResponse.json({ error: 'Only the primary admin can grant admin access' }, { status: 403 });

    const { targetId, revoke } = await req.json();
    if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });

    await adminDb.collection('talents').doc(targetId).set(
        { isAdmin: revoke ? false : true },
        { merge: true }
    );

    return NextResponse.json({ success: true, isAdmin: !revoke });
}
