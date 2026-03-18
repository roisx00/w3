import { NextRequest, NextResponse } from 'next/server';
import { PAYMENT_WALLET, BASE_USDC_CONTRACT } from '@/lib/payments';
import { adminDb } from '@/lib/firebase-admin';

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function hexToAddress(hex: string): string {
    return '0x' + hex.slice(-40).toLowerCase();
}

function hexToUSDC(hex: string): number {
    // USDC on Base has 6 decimals
    return parseInt(hex, 16) / 1_000_000;
}

function hexToETH(hex: string): number {
    // ETH has 18 decimals
    return parseInt(hex, 16) / 1e18;
}

export async function POST(req: NextRequest) {
    const { txHash, expectedAmount, currency = 'USDC' } = await req.json();

    if (!txHash || !expectedAmount) {
        return NextResponse.json({ valid: false, error: 'Missing txHash or expectedAmount' }, { status: 400 });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return NextResponse.json({ valid: false, error: 'Invalid transaction hash format' }, { status: 400 });
    }

    const alchemyKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyKey) {
        return NextResponse.json({ valid: false, error: 'Payment verification not configured.' }, { status: 500 });
    }

    const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;

    try {
        // Step 0: Check if this transaction hash has already been used
        // Skip if adminDb is not initialized (e.g. missing service account key)
        if (adminDb) {
            const existing = await adminDb.collection('payments')
                .where('txHash', '==', txHash)
                .limit(1)
                .get();
            
            if (!existing.empty) {
                return NextResponse.json({ valid: false, error: 'This transaction has already been used.' });
            }
        } else {
            console.warn('Skipping duplicate hash check: adminDb not initialized.');
        }

        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [txHash],
                id: 1,
            }),
            cache: 'no-store',
        });
        const data = await res.json();

        if (!data.result) {
            return NextResponse.json({ valid: false, error: 'Transaction not found. Make sure you are on Base Mainnet.' });
        }

        const receipt = data.result;

        // Transaction must be confirmed (has blockHash and status === 0x1)
        if (!receipt.blockHash) {
            return NextResponse.json({ valid: false, error: 'Transaction is still pending. Wait for confirmation.' });
        }
        if (receipt.status === '0x0') {
            return NextResponse.json({ valid: false, error: 'Transaction failed on-chain.' });
        }

        if (currency === 'ETH') {
            // Native ETH transfer — fetch the transaction itself to check value + to
            const txRes = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionByHash',
                    params: [txHash],
                    id: 2,
                }),
                cache: 'no-store',
            });
            const txData = await txRes.json();
            const tx = txData.result;

            if (!tx) return NextResponse.json({ valid: false, error: 'Transaction not found.' });

            if (tx.to?.toLowerCase() !== PAYMENT_WALLET.toLowerCase()) {
                return NextResponse.json({ valid: false, error: `ETH not sent to our wallet. Expected ${PAYMENT_WALLET}.` });
            }

            const ethSent = hexToETH(tx.value);
            if (ethSent < expectedAmount * 0.995) { // 0.5% tolerance for rounding
                return NextResponse.json({
                    valid: false,
                    error: `Insufficient ETH. Expected ~${expectedAmount.toFixed(6)} ETH but found ${ethSent.toFixed(6)} ETH.`,
                });
            }

            return NextResponse.json({ valid: true, amount: ethSent, currency: 'ETH' });
        }

        // USDC: Find Transfer log where `to` = our payment wallet
        const transferLog = receipt.logs?.find((log: { address: string; topics: string[]; data: string }) =>
            log.address?.toLowerCase() === BASE_USDC_CONTRACT.toLowerCase() &&
            log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
            log.topics?.[2] &&
            hexToAddress(log.topics[2]) === PAYMENT_WALLET.toLowerCase()
        );

        if (!transferLog) {
            return NextResponse.json({
                valid: false,
                error: `No USDC transfer to our wallet found in this tx. Make sure you sent USDC on Base to ${PAYMENT_WALLET}.`,
            });
        }

        const amount = hexToUSDC(transferLog.data);

        if (amount < expectedAmount - 0.01) {
            return NextResponse.json({
                valid: false,
                error: `Insufficient amount. Expected $${expectedAmount} USDC but found $${amount.toFixed(2)} USDC.`,
            });
        }

        return NextResponse.json({ valid: true, amount, currency: 'USDC' });
    } catch (e: any) {
        console.error('Payment verification error:', e);
        return NextResponse.json({ 
            valid: false, 
            error: `Verification failed: ${e.message || 'Unknown error'}. Please try again.` 
        }, { status: 500 });
    }
}
