import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const xToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const body = await req.json().catch(() => ({}));
    const uid: string | undefined = body.uid;

    if (!xToken || !uid) {
        return NextResponse.json({ error: 'Missing token or uid' }, { status: 401 });
    }

    // Verify the X access token by calling Twitter API
    try {
        const r = await fetch('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${xToken}` },
        });
        if (!r.ok) throw new Error('Invalid X access token');

        const { data } = await r.json();
        const expectedUid = `tw_${data.id}`;
        if (expectedUid !== uid) throw new Error('UID mismatch');
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!adminAuth) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 503 });
        }
        const customToken = await adminAuth.createCustomToken(uid);
        return NextResponse.json({ customToken });
    } catch (e: any) {
        console.error('[firebase-auth] Error creating custom token:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
