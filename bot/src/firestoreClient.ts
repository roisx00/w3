import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

let app: App;

if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var not set.');
    app = initializeApp({ credential: cert(JSON.parse(key)) });
} else {
    app = getApps()[0];
}

export const db: Firestore = getFirestore(app);

/**
 * Write a log entry to Firestore.
 */
export async function writeLog(
    jobId: string,
    userId: string,
    message: string,
    type: 'info' | 'success' | 'error' | 'warn' = 'info',
): Promise<void> {
    try {
        await db.collection('mint_bot_logs').add({
            jobId,
            userId,
            message,
            type,
            timestamp: new Date(),
        });
    } catch {
        // Don't crash the bot if logging fails
        console.error('[log-write-fail]', message);
    }
}

/**
 * Update a job document fields.
 */
export async function updateJob(jobId: string, fields: Record<string, any>): Promise<void> {
    await db.collection('mint_bot_jobs').doc(jobId).update({
        ...fields,
        updatedAt: new Date(),
    });
}
