export type MintJobStatus = 'pending' | 'monitoring' | 'minting' | 'success' | 'failed' | 'stopped';
export type LogType = 'info' | 'success' | 'error' | 'warn';

export interface MintBotWallet {
    id: string;
    firebase_user_id: string;
    name: string;
    address: string;
    encrypted_key: string;
    iv: string;
    tag: string;
}

export interface MintBotJob {
    id: string;
    firebase_user_id: string;
    wallet_id: string;
    wallet_address: string;
    contract_address: string;
    chain_id: number;
    rpc_url: string;
    mint_function: string;
    mint_amount: number;
    mint_price: string;      // ETH string
    gas_multiplier: number;
    max_retries: number;
    status: MintJobStatus;
    tx_hash?: string;
    error_message?: string;
}
