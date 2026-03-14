import { ethers } from 'ethers';
import { MintBotJob } from './types';
import { supabase } from './supabaseClient';
import { executeMint } from './executor';
import { getEthersSigner } from './walletManager';

// Default RPC fallbacks (same as Next.js API) — used if job.rpcUrl is empty
const DEFAULT_RPCS: Record<number, string> = {
    1:     process.env.DEFAULT_ETH_RPC      || 'https://eth.llamarpc.com',
    8453:  process.env.DEFAULT_BASE_RPC     || 'https://mainnet.base.org',
    137:   process.env.DEFAULT_POLYGON_RPC  || 'https://polygon.llamarpc.com',
    42161: process.env.DEFAULT_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
};

// State variable names commonly used to signal a public sale is live
const ACTIVE_STATE_SELECTORS = [
    'mintActive',
    'saleActive',
    'publicSaleActive',
    'publicMintActive',
    'isSaleActive',
    'isMintActive',
    'isPublicMintActive',
    'publicSaleIsActive',
];

// ABI fragments for the above checks + paused()
const STATE_ABI = [
    ...ACTIVE_STATE_SELECTORS.map(name => `function ${name}() view returns (bool)`),
    'function paused() view returns (bool)',
    'function mint(uint256 quantity) payable',
    'function publicMint(uint256 quantity) payable',
    'function whitelistMint(uint256 quantity) payable',
    'function mint() payable',
    'function publicMint() payable',
];

/**
 * Check whether the contract appears to have an open mint right now.
 * Strategy:
 *   1. Try known "active" state variables — if any returns true, mint is live.
 *   2. If paused() exists and returns true, mint is not live.
 *   3. Static-call the mint function — if it does NOT revert with a "not active"
 *      type message, consider it potentially live and attempt a real tx.
 */
async function isMintLive(
    contract: ethers.Contract,
    job: MintBotJob,
): Promise<boolean> {
    // 1. Check positive state variables
    for (const selector of ACTIVE_STATE_SELECTORS) {
        try {
            const result: boolean = await (contract as any)[selector]();
            if (result === true) return true;
        } catch {
            // Function doesn't exist on this contract — skip
        }
    }

    // 2. Check paused()
    try {
        const isPaused: boolean = await (contract as any).paused();
        if (isPaused) return false;
    } catch { /* no paused() — ignore */ }

    // 3. Static-call the target mint function
    try {
        const value = ethers.parseEther(job.mint_price || '0');
        if (job.mint_function === 'mint' || job.mint_function === 'publicMint') {
            try {
                await (contract as any)[job.mint_function].staticCall(job.mint_amount, { value });
            } catch {
                await (contract as any)[job.mint_function].staticCall({ value });
            }
        } else {
            await (contract as any)[job.mint_function].staticCall(job.mint_amount, { value });
        }
        // Static call succeeded — mint is likely live
        return true;
    } catch (err: any) {
        const msg = (err.reason || err.message || '').toLowerCase();
        // These error strings strongly indicate the mint isn't live yet
        const notLivePatterns = [
            'not active', 'not live', 'not open', 'sale not', 'mint not',
            'paused', 'not started', 'not begun', 'inactive', 'not enabled',
            'before sale', 'presale', 'not started', 'coming soon',
        ];
        if (notLivePatterns.some(p => msg.includes(p))) return false;
        // Any other revert (e.g. insufficient ETH, max supply) means mint IS live
        // but the transaction parameters need adjustment — treat as "live"
        return true;
    }
}

/**
 * Start monitoring a single job.
 * Subscribes to new blocks, checks mint state each block.
 * Returns a cleanup function to stop monitoring.
 */
export function startMonitoring(
    job: MintBotJob,
    onComplete: (jobId: string) => void,
): () => void {
    let stopped = false;
    let executing = false;

    (async () => {
        await supabase.from('bot_logs').insert({
            job_id: job.id,
            firebase_user_id: job.firebase_user_id,
            message: `Started monitoring ${job.contract_address} on chain ${job.chain_id}`,
            type: 'info'
        });

        const provider = new ethers.JsonRpcProvider(job.rpc_url);
        
        // Dynamically build ABI for state checks
        const dynamicAbi = [...STATE_ABI];
        const isStandard = STATE_ABI.some(s => s.includes(`function ${job.mint_function}(`));
        if (!isStandard) {
            dynamicAbi.push(`function ${job.mint_function}(uint256 quantity) payable`);
            dynamicAbi.push(`function ${job.mint_function}() payable`);
        }

        const contract = new ethers.Contract(job.contract_address, dynamicAbi, provider);


        const checkBlock = async (blockNumber: number) => {
            if (stopped || executing) return;

            try {
                const live = await isMintLive(contract, job);
                if (!live) {
                    await supabase.from('bot_logs').insert({
                        job_id: job.id,
                        firebase_user_id: job.firebase_user_id,
                        message: `Block ${blockNumber} — mint not live yet, watching…`,
                        type: 'info'
                    });
                    return;
                }

                // Mint is live — execute immediately
                executing = true;
                stopped = true; // Stop block listener
                provider.off('block', checkBlock);

                await supabase.from('bot_logs').insert({
                    job_id: job.id,
                    firebase_user_id: job.firebase_user_id,
                    message: `🔥 MINT IS LIVE at block ${blockNumber}! Executing…`,
                    type: 'warn'
                });
                
                await supabase.from('mint_jobs').update({ status: 'minting', updated_at: new Date().toISOString() }).eq('id', job.id);

                // Get signer with decrypted wallet
                const signer = await getEthersSigner(job.wallet_id, provider);

                try {
                    const txHash = await executeMint(job, signer);
                    await supabase.from('mint_jobs').update({ status: 'success', tx_hash: txHash, updated_at: new Date().toISOString() }).eq('id', job.id);
                    await supabase.from('bot_logs').insert({
                        job_id: job.id,
                        firebase_user_id: job.firebase_user_id,
                        message: `✅ Mint successful! TX: ${txHash}`,
                        type: 'success'
                    });
                } catch (err: any) {
                    const errMsg = err.reason || err.message || 'Unknown error';
                    await supabase.from('mint_jobs').update({ status: 'failed', error_message: errMsg, updated_at: new Date().toISOString() }).eq('id', job.id);
                    await supabase.from('bot_logs').insert({
                        job_id: job.id,
                        firebase_user_id: job.firebase_user_id,
                        message: `❌ Mint failed: ${errMsg}`,
                        type: 'error'
                    });
                }

                onComplete(job.id);
            } catch (err: any) {
                await supabase.from('bot_logs').insert({
                    job_id: job.id,
                    firebase_user_id: job.firebase_user_id,
                    message: `Block ${blockNumber} check error: ${err.message}`,
                    type: 'warn'
                });
            }
        };

        provider.on('block', checkBlock);

        // Graceful shutdown: resolve when stopped externally
        const poll = setInterval(() => {
            if (stopped) {
                clearInterval(poll);
                provider.removeAllListeners();
            }
        }, 1000);
    })().catch(async (err) => {
        await supabase.from('bot_logs').insert({
            job_id: job.id,
            firebase_user_id: job.firebase_user_id,
            message: `Monitor crashed: ${err.message}`,
            type: 'error'
        });
        await supabase.from('mint_jobs').update({ status: 'failed', error_message: err.message, updated_at: new Date().toISOString() }).eq('id', job.id);
        onComplete(job.id);
    });

    return () => { stopped = true; };
}
