import crypto from 'crypto';
import { ethers } from 'ethers';
import { db } from './firestoreClient';
import { MintBotWallet } from './types';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;

function getKey(): Buffer {
    const hex = process.env.WALLET_ENCRYPTION_KEY;
    if (!hex) throw new Error('WALLET_ENCRYPTION_KEY is not set');
    const buf = Buffer.from(hex, 'hex');
    if (buf.length !== KEY_BYTES) throw new Error('WALLET_ENCRYPTION_KEY must be 64 hex chars');
    return buf;
}

/**
 * Decrypts a stored encrypted private key.
 * Throws if the auth tag is invalid — protect against tampered storage.
 */
export function decryptPrivateKey(encrypted: string, iv: string, tag: string): string {
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'hex')),
        decipher.final(),
    ]).toString('utf8');
}

/**
 * Fetch a wallet from Firestore and return a ready ethers.Wallet signer.
 * The provider is attached so the signer can send transactions.
 */
export async function getEthersSigner(
    walletId: string,
    provider: ethers.JsonRpcProvider,
): Promise<ethers.Wallet> {
    const snap = await db.collection('mint_bot_wallets').doc(walletId).get();
    if (!snap.exists) throw new Error(`Wallet ${walletId} not found in Firestore.`);

    const data = snap.data() as MintBotWallet;
    const privateKey = decryptPrivateKey(data.encryptedKey, data.iv, data.tag);

    return new ethers.Wallet(privateKey, provider);
}
