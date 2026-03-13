// @ts-nocheck
import { ethers } from 'ethers';
import { MintBotJob } from './types';
import { writeLog, updateJob } from './firestoreClient';

// Minimal ABI covering the three most common public mint signatures
const MINT_ABI = [
    'function mint(uint256 quantity) payable',
    'function publicMint(uint256 quantity) payable',
    'function whitelistMint(uint256 quantity) payable',
    // Some contracts use a no-arg mint for fixed quantity
    'function mint() payable',
    'function publicMint() payable',
];

/**
 * Sleep for ms milliseconds.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Calculate gas settings with a multiplier applied to the current base fee.
 * Uses EIP-1559 on supported chains, falls back to legacy gas price.
 */
async function buildGasOptions(
    provider: ethers.JsonRpcProvider,
    multiplier: number,
): Promise<{ maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint; gasPrice?: bigint }> {
    const feeData = await provider.getFeeData();

    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559
        const mul = BigInt(Math.round(multiplier * 100));
        return {
            maxFeePerGas: (feeData.maxFeePerGas * mul) / BigInt(100),
            maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas * mul) / BigInt(100),
        };
    }

    // Legacy
    const gasPrice = feeData.gasPrice ?? BigInt(0);
    const mul = BigInt(Math.round(multiplier * 100));
    return { gasPrice: (gasPrice * mul) / BigInt(100) };
}

/**
 * Attempt to send a mint transaction.
 * Returns the transaction hash on success.
 * Throws on unrecoverable errors.
 */
export async function executeMint(
    job: MintBotJob,
    signer: ethers.Wallet,
): Promise<string> {
    const contract = new ethers.Contract(job.contractAddress, MINT_ABI, signer);
    const value = ethers.parseEther(job.mintPrice || '0');
    const gasOpts = await buildGasOptions(signer.provider as ethers.JsonRpcProvider, job.gasMultiplier);

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < job.maxRetries) {
        attempt++;
        await writeLog(job.id, job.userId, `Attempt ${attempt}/${job.maxRetries} — sending mint tx...`, 'info');

        try {
            let tx: ethers.TransactionResponse;

            // Try quantity-based mint first, then no-arg
            try {
                if (job.mintFunction === 'whitelistMint') {
                    tx = await (contract as any)[job.mintFunction](job.mintAmount, { value, ...gasOpts });
                } else {
                    tx = await (contract as any)[job.mintFunction](job.mintAmount, { value, ...gasOpts });
                }
            } catch (e: any) {
                // If quantity argument fails, try no-argument variant
                if (e.code === 'INVALID_ARGUMENT' || e.message?.includes('wrong number')) {
                    tx = await (contract as any)[job.mintFunction]({ value, ...gasOpts });
                } else {
                    throw e;
                }
            }

            await writeLog(job.id, job.userId, `Tx sent: ${tx.hash} — waiting for confirmation…`, 'info');

            const receipt = await tx.wait(1);
            if (receipt && receipt.status === 1) {
                return tx.hash;
            }
            throw new Error('Transaction reverted on-chain.');
        } catch (err: any) {
            lastError = err;
            const msg = err.reason || err.message || 'Unknown error';
            await writeLog(job.id, job.userId, `Attempt ${attempt} failed: ${msg}`, 'warn');

            if (attempt < job.maxRetries) {
                const backoff = 1000 * attempt; // 1s, 2s, 3s…
                await writeLog(job.id, job.userId, `Retrying in ${backoff}ms…`, 'info');
                await sleep(backoff);
            }
        }
    }

    throw lastError ?? new Error('All mint attempts failed.');
}
