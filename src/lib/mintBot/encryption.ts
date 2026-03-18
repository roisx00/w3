
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;

function getKey(): Buffer {
    const hex = process.env.WALLET_ENCRYPTION_KEY;
    if (!hex) throw new Error('WALLET_ENCRYPTION_KEY is not set in environment variables.');
    const buf = Buffer.from(hex, 'hex');
    if (buf.length !== KEY_BYTES) {
        throw new Error('WALLET_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).');
    }
    return buf;
}

/**
 * Encrypts a private key string with AES-256-GCM.
 * Returns ciphertext, iv, and auth tag — all as hex strings.
 */
export function encryptPrivateKey(privateKey: string): {
    encrypted: string;
    iv: string;
    tag: string;
} {
    const key = getKey();
    const iv = crypto.randomBytes(12); // 96-bit IV (recommended for GCM)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(privateKey, 'utf8'),
        cipher.final(),
    ]);
    return {
        encrypted: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        tag: cipher.getAuthTag().toString('hex'),
    };
}

/**
 * Decrypts a private key previously encrypted with encryptPrivateKey().
 * Throws if the auth tag is invalid (data tampered).
 */
export function decryptPrivateKey(encrypted: string, iv: string, tag: string): string {
    const key = getKey();
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'hex')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
