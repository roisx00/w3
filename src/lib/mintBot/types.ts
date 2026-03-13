// ─── Mint Bot Shared Types ────────────────────────────────────────────────────

export type MintJobStatus = 'pending' | 'monitoring' | 'minting' | 'success' | 'failed' | 'stopped';
export type LogType = 'info' | 'success' | 'error' | 'warn';

export interface MintBotWallet {
    id: string;
    userId: string;
    name: string;
    address: string;
    encryptedKey: string;   // AES-256-GCM ciphertext (hex)
    iv: string;             // 12-byte IV (hex)
    tag: string;            // 16-byte GCM auth tag (hex)
    createdAt: any;
}

export interface MintBotJob {
    id: string;
    userId: string;
    walletId: string;
    walletAddress: string;
    contractAddress: string;
    chainId: number;
    rpcUrl: string;
    mintFunction: 'mint' | 'publicMint' | 'whitelistMint';
    mintAmount: number;
    mintPrice: string;       // ETH string, e.g. "0.08"
    gasMultiplier: number;   // 1.0 = normal, 1.5 = +50% priority
    maxRetries: number;
    status: MintJobStatus;
    txHash?: string;
    error?: string;
    createdAt: any;
    updatedAt: any;
}

export interface MintBotLog {
    id?: string;
    jobId: string;
    userId: string;
    message: string;
    type: LogType;
    timestamp: any;
}
