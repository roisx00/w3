// @ts-nocheck
export type MintJobStatus = 'pending' | 'monitoring' | 'minting' | 'success' | 'failed' | 'stopped';
export type LogType = 'info' | 'success' | 'error' | 'warn';

export interface MintBotWallet {
    id: string;
    userId: string;
    name: string;
    address: string;
    encryptedKey: string;
    iv: string;
    tag: string;
}

export interface MintBotJob {
    id: string;
    userId: string;
    walletId: string;
    walletAddress: string;
    contractAddress: string;
    chainId: number;
    rpcUrl: string;
    mintFunction: string;
    mintAmount: number;
    mintPrice: string;      // ETH string
    gasMultiplier: number;
    maxRetries: number;
    status: MintJobStatus;
    txHash?: string;
    error?: string;
}
