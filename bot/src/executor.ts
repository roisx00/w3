import { ethers } from 'ethers';
import { MintBotJob } from './types';
import { supabase } from './supabaseClient';

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
// SeaDrop Controller Address (Deterministic on most chains)
const SEADROP_ADDRESS = '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5';
const SEADROP_ABI = [
    'function mintPublic(address nft, address feeRecipient, address minterIfNotPayer, uint256 quantity) payable',
    'function getAllowedFeeRecipients(address nft) view returns (address[])'
];

/**
 * Attempt to send a mint transaction.
 */
export async function executeMint(
    job: MintBotJob,
    signer: ethers.Wallet,
): Promise<string> {
    // ...
    const dynamicAbi = [...MINT_ABI];
    const isStandard = MINT_ABI.some(s => s.includes(`function ${job.mint_function}(`));
    
    if (!isStandard) {
        dynamicAbi.push(`function ${job.mint_function}(uint256 quantity) payable`);
        dynamicAbi.push(`function ${job.mint_function}() payable`);
    }

    const contract = new ethers.Contract(job.contract_address, dynamicAbi, signer);
    const seadrop = new ethers.Contract(SEADROP_ADDRESS, SEADROP_ABI, signer);
    const value = ethers.parseEther(job.mint_price || '0');

    const gasOpts = await buildGasOptions(signer.provider as ethers.JsonRpcProvider, job.gas_multiplier);

    let attempt = 0;
    let lastError: any = null;

    while (attempt < job.max_retries) {
        attempt++;
        await supabase.from('bot_logs').insert({
            job_id: job.id,
            firebase_user_id: job.firebase_user_id,
            message: `Attempt ${attempt}/${job.max_retries} — sending mint tx...`,
            type: 'info'
        });

        try {
            let tx: ethers.TransactionResponse;

            // 1. Try SeaDrop mint if on a supported chain
            if (job.chain_id === 8453 || job.chain_id === 1) {
                try {
                    // Fetch required fee recipient for SeaDrop
                    const recipients = await seadrop.getAllowedFeeRecipients(job.contract_address);
                    const feeRecipient = recipients.length > 0 ? recipients[0] : ethers.ZeroAddress;
                    
                    await seadrop.mintPublic.staticCall(job.contract_address, feeRecipient, signer.address, job.mint_amount, { value });
                    await supabase.from('bot_logs').insert({
                        job_id: job.id,
                        firebase_user_id: job.firebase_user_id,
                        message: `Detected SeaDrop contract — minting via controller with feeRecipient ${feeRecipient}...`,
                        type: 'info'
                    });
                    tx = await seadrop.mintPublic(job.contract_address, feeRecipient, signer.address, job.mint_amount, { value, ...gasOpts });
                    return await finishTx(job, tx);
                } catch (se: any) {
                    // Fall through to direct mint
                }
            }

            // 2. Try direct mint...
            try {
                tx = await (contract as any)[job.mint_function](job.mint_amount, { value, ...gasOpts });
            } catch (e: any) {
                if (e.code === 'INVALID_ARGUMENT' || e.message?.includes('wrong number')) {
                    tx = await (contract as any)[job.mint_function]({ value, ...gasOpts });
                } else {
                    throw e;
                }
            }

            return await finishTx(job, tx);
        } catch (err: any) {
            lastError = err;
            const msg = err.reason || err.message || 'Unknown error';
            
            if (msg.includes('insufficient funds')) {
                await supabase.from('bot_logs').insert({
                    job_id: job.id,
                    firebase_user_id: job.firebase_user_id,
                    message: `❌ INSUFFICIENT FUNDS: Wallet needs more ETH for gas.`,
                    type: 'error'
                });
                throw new Error('Insufficient funds.');
            }

            await supabase.from('bot_logs').insert({
                job_id: job.id,
                firebase_user_id: job.firebase_user_id,
                message: `Attempt ${attempt} failed: ${msg}`,
                type: 'warn'
            });

            if (attempt < job.max_retries) {
                const backoff = 1000 * attempt;
                await sleep(backoff);
            }
        }
    }

    throw lastError ?? new Error('All mint attempts failed.');
}


async function finishTx(job: MintBotJob, tx: ethers.TransactionResponse): Promise<string> {
    await supabase.from('bot_logs').insert({
        job_id: job.id,
        firebase_user_id: job.firebase_user_id,
        message: `Tx sent: ${tx.hash} — waiting for confirmation…`,
        type: 'info'
    });
    const receipt = await tx.wait(1);
    if (receipt && receipt.status === 1) {
        return tx.hash;
    }
    throw new Error('Transaction reverted on-chain.');
}

