// @ts-nocheck
/**
 * W3Hub NFT Mint Sniper Bot
 * ─────────────────────────
 * Run: npm run dev   (development)
 *      npm start     (production after build)
 *
 * Hosting: Railway, Render, Fly.io, or any VPS with Node 18+.
 * Set all env vars from .env.example before starting.
 */

import 'dotenv/config';
import { db, updateJob, writeLog } from './firestoreClient';
import { startMonitoring } from './monitor';
import { MintBotJob } from './types';

const POLL_MS = Number(process.env.POLL_INTERVAL_MS) || 3000;

// Track which job IDs are currently being monitored
const activeMonitors = new Map<string, () => void>(); // jobId → stopFn


async function mainLoop(): Promise<void> {
    const IS_LOCKED = true; // GLOBAL LOCK
    if (IS_LOCKED) {
        console.warn('⚠️ [bot] MINT BOT IS GLOBALLY LOCKED. EXITING...');
        process.exit(0);
    }

    console.log(`[bot] Listening for Firestore changes (real-time)...`);

    // Subscribe to monitoring jobs
    const unsubscribe = db.collection('mint_bot_jobs')
        .where('status', '==', 'monitoring')
        .onSnapshot(async (snapshot) => {
            const currentJobs = new Set<string>();

            for (const doc of snapshot.docs) {
                const job = { id: doc.id, ...doc.data() } as MintBotJob;
                currentJobs.add(job.id);

                if (!activeMonitors.has(job.id)) {
                    console.log(`[bot] New monitoring job detected: ${job.id} → ${job.contractAddress}`);
                    const stop = startMonitoring(job, (completedJobId) => {
                        activeMonitors.delete(completedJobId);
                        console.log(`[bot] Monitor finished for job ${completedJobId}`);
                    });
                    activeMonitors.set(job.id, stop);
                }
            }

            // Stop monitors for jobs that are no longer in the monitoring snapshot
            for (const [jobId, stop] of activeMonitors) {
                if (!currentJobs.has(jobId)) {
                    console.log(`[bot] Job ${jobId} is no longer monitoring. Stopping monitor.`);
                    stop();
                    activeMonitors.delete(jobId);
                }
            }

            console.log(`[bot] Active monitors: ${activeMonitors.size}`);
        }, (err) => {
            console.error('[bot] Snapshot error:', err.message);
        });

    // Main loop is now just a wait for shutdown
    return new Promise(() => {}); // Keep alive
}


function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

// Graceful shutdown
function shutdown(): void {
    console.log('\n[bot] Shutting down gracefully…');
    for (const [jobId, stop] of activeMonitors) {
        console.log(`[bot] Stopping monitor: ${jobId}`);
        stop();
    }
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Crash guard
process.on('uncaughtException', (err) => {
    console.error('[bot] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('[bot] Unhandled rejection:', reason);
});

console.log('🤖 W3Hub Mint Sniper Bot starting…');
mainLoop().catch(err => {
    console.error('[bot] Fatal error:', err);
    process.exit(1);
});
