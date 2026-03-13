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

async function fetchActiveJobs(): Promise<MintBotJob[]> {
    const snap = await db
        .collection('mint_bot_jobs')
        .where('status', '==', 'monitoring')
        .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MintBotJob));
}

async function fetchStoppedJobIds(): Promise<Set<string>> {
    const snap = await db
        .collection('mint_bot_jobs')
        .where('status', 'in', ['stopped', 'success', 'failed'])
        .get();

    return new Set(snap.docs.map(d => d.id));
}

async function mainLoop(): Promise<void> {
    console.log(`[bot] Polling Firestore every ${POLL_MS}ms…`);

    while (true) {
        try {
            // 1. Stop monitors for jobs that have been stopped/succeeded/failed externally
            const doneIds = await fetchStoppedJobIds();
            for (const [jobId, stop] of activeMonitors) {
                if (doneIds.has(jobId)) {
                    console.log(`[bot] Stopping monitor for job ${jobId}`);
                    stop();
                    activeMonitors.delete(jobId);
                }
            }

            // 2. Start monitors for new active jobs
            const jobs = await fetchActiveJobs();
            for (const job of jobs) {
                if (activeMonitors.has(job.id)) continue; // already running

                console.log(`[bot] Spawning monitor for job ${job.id} → ${job.contractAddress}`);

                const stop = startMonitoring(job, (completedJobId) => {
                    activeMonitors.delete(completedJobId);
                    console.log(`[bot] Monitor finished for job ${completedJobId}`);
                });

                activeMonitors.set(job.id, stop);
            }

            console.log(`[bot] ${activeMonitors.size} active monitor(s)`);
        } catch (err: any) {
            console.error('[bot] Poll error:', err.message);
        }

        await sleep(POLL_MS);
    }
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
