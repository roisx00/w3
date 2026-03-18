import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const ADMIN_DID = process.env.NEXT_PUBLIC_ADMIN_UID || 'cmmutno61018m0dlb7p754q7c';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'roisx00@gmail.com';

const ALLOWED_COLLECTIONS = new Set([
    'talents', 'kols', 'jobs', 'airdrops', 'payments', 'kol_proposals', 'applications', 'referrals'
]);

async function verifyAdmin(token: string): Promise<boolean> {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId || !token) return false;
    try {
        const res = await fetch('https://auth.privy.io/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}`, 'privy-app-id': appId },
        });
        if (!res.ok) return false;
        const user = await res.json();
        const emailAccount = user.linked_accounts?.find((a: any) => a.type === 'email');
        if (user.id === ADMIN_DID || emailAccount?.address === ADMIN_EMAIL) return true;
        // Check isAdmin field in talents doc
        const talentSnap = await adminDb.collection('talents').doc(user.id).get();
        return !!(talentSnap.exists && talentSnap.data()?.isAdmin === true);
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { collection, id } = await req.json();
    if (!collection || !id) return NextResponse.json({ error: 'Missing collection or id' }, { status: 400 });
    if (!ALLOWED_COLLECTIONS.has(collection)) return NextResponse.json({ error: 'Collection not allowed' }, { status: 400 });

    await adminDb.collection(collection).doc(id).delete();
    return NextResponse.json({ success: true });
}
