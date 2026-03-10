import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/notify-tracked
 * Body: { airdropId: string, airdropName: string, message?: string }
 *
 * Finds all users who track this airdrop and writes a notification
 * to each user's 'notifications' sub-collection in Firestore.
 * Also updates the airdrop's lastTaskUpdate timestamp to bump it to the top.
 *
 * This route is called from the admin panel when new tasks are published.
 */
export async function POST(req: NextRequest) {
    try {
        const { airdropId, airdropName, message } = await req.json();

        if (!airdropId || !airdropName) {
            return NextResponse.json({ error: 'airdropId and airdropName are required' }, { status: 400 });
        }

        const notificationMessage = message || `⚡ ${airdropName} just published new tasks! Check them out.`;

        // 1. Update the airdrop's lastTaskUpdate to bump it to the top
        await adminDb.collection('airdrops').doc(airdropId).update({
            lastTaskUpdate: FieldValue.serverTimestamp(),
        });

        // 2. Find all users tracking this airdrop
        const usersSnap = await adminDb
            .collection('talents')
            .where('trackedAirdrops', 'array-contains', airdropId)
            .get();

        if (usersSnap.empty) {
            return NextResponse.json({ notified: 0, message: 'No tracked users found.' });
        }

        // 3. Write a notification document to each user's notifications sub-collection
        const batch = adminDb.batch();
        usersSnap.docs.forEach(userDoc => {
            const notifRef = adminDb
                .collection('talents')
                .doc(userDoc.id)
                .collection('notifications')
                .doc(); // auto-id
            batch.set(notifRef, {
                airdropId,
                airdropName,
                message: notificationMessage,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();

        return NextResponse.json({ notified: usersSnap.size });
    } catch (err: any) {
        console.error('notify-tracked error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
