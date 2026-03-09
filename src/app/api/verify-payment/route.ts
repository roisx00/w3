import { NextRequest, NextResponse } from 'next/server';
import { PAYMENT_WALLET, BASE_USDC_CONTRACT } from '@/lib/payments';

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function hexToAddress(hex: string): string {
    return '0x' + hex.slice(-40).toLowerCase();
}

function hexToUSDC(hex: string): number {
    // USDC on Base has 6 decimals
    return parseInt(hex, 16) / 1_000_000;
}

export async function POST(req: NextRequest) {
    const { txHash, expectedAmount } = await req.json();

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

        // Find a USDC Transfer log where `to` = our payment wallet
        const transferLog = receipt.logs?.find((log: any) =>
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

        if (Math.abs(amount - expectedAmount) > 0.01) {
            return NextResponse.json({
                valid: false,
                error: `Wrong amount. Expected $${expectedAmount} USDC but found $${amount.toFixed(2)} USDC.`,
            });
        }

        return NextResponse.json({ valid: true, amount });
    } catch {
        return NextResponse.json({ valid: false, error: 'Failed to reach BaseScan. Please try again.' }, { status: 500 });
    }
}
