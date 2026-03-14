import 'dotenv/config';
import { supabase } from './supabaseClient';
import { startMonitoring } from './monitor';
import { MintBotJob } from './types';

const POLL_MS = Number(process.env.POLL_INTERVAL_MS) || 5000;

// Track which job IDs are currently being monitored
const activeMonitors = new Map<string, () => void>(); // jobId → stopFn

async function mainLoop(): Promise<void> {
    console.log(`[bot] Starting polling loop (every ${POLL_MS}ms)...`);

    while (true) {
        try {
            const { data: jobs, error } = await supabase
                .from('mint_jobs')
                .select('*')
                .eq('status', 'monitoring');

            if (error) {
                console.error('[bot] Supabase error:', error.message);
            } else {
                const currentJobIds = new Set<string>();

                for (const jobData of jobs) {
                    const job = jobData as MintBotJob;
                    currentJobIds.add(job.id);

                    if (!activeMonitors.has(job.id)) {
                        console.log(`[bot] New monitoring job detected: ${job.id} → ${job.contract_address}`);
                        const stop = startMonitoring(job, (completedJobId) => {
                            activeMonitors.delete(completedJobId);
                            console.log(`[bot] Monitor finished for job ${completedJobId}`);
                        });
                        activeMonitors.set(job.id, stop);
                    }
                }

                // Stop monitors for jobs that are no longer in the monitoring snapshot
                for (const [jobId, stop] of activeMonitors) {
                    if (!currentJobIds.has(jobId)) {
                        console.log(`[bot] Job ${jobId} is no longer monitoring. Stopping monitor.`);
                        stop();
                        activeMonitors.delete(jobId);
                    }
                }
            }
        } catch (err: any) {
            console.error('[bot] Loop error:', err.message);
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
