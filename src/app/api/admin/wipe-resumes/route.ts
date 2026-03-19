import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { verifyPrimaryAdmin } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isPrimary = await verifyPrimaryAdmin(token);
    if (!isPrimary) return NextResponse.json({ error: 'Primary admin only' }, { status: 403 });

    try {
        // Delete all docs in talents collection in batches of 500
        let deleted = 0;
        let batch = adminDb.batch();
        let count = 0;

        const snap = await adminDb.collection('talents').get();
        for (const doc of snap.docs) {
            batch.delete(doc.ref);
            count++;
            deleted++;
            if (count === 500) {
                await batch.commit();
                batch = adminDb.batch();
                count = 0;
            }
        }
        if (count > 0) await batch.commit();

        // Also delete resume PDFs from Storage (resumes/ folder)
        try {
            const bucket = adminStorage.bucket();
            await bucket.deleteFiles({ prefix: 'resumes/' });
        } catch {
            // Storage cleanup is best-effort — don't fail if it errors
        }

        return NextResponse.json({ success: true, deleted });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Wipe failed' }, { status: 500 });
    }
}
