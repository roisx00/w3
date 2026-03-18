// ⚠️ Replace PAYMENT_WALLET with your actual Base Mainnet USDC wallet address before going live
export const PAYMENT_WALLET = '0x198c2d42c71e8046f34eca9a0f5c81b9f3db2afb';

export const PRICES = {
    JOB_POST: 50,
    AIRDROP_POST: 30,
    USER_BADGE: 2,
    KOL_BADGE: 5,
    CV_BOOST_MONTHLY: 10,
    JOB_BOOST_MONTHLY: 50,
    KOL_BOOST_MONTHLY: 20,
    REVIEW: 1,
} as const;

export const BASE_CHAIN_NAME = 'Base Mainnet';
export const BASE_CHAIN_ID = 8453;
export const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const BASE_EXPLORER_TX = 'https://basescan.org/tx/';

export type PaymentType = 'job_post' | 'airdrop_post' | 'user_badge' | 'kol_badge' | 'cv_boost' | 'job_boost' | 'kol_boost';

export const PAYMENT_LABELS: Record<PaymentType, string> = {
    job_post: 'Job Listing Fee',
    airdrop_post: 'Airdrop Listing Fee',
    user_badge: 'Access Badge',
    kol_badge: 'KOL Verified Badge',
    cv_boost: 'CV Top Boost (30 days)',
    job_boost: 'Job Top Boost (30 days)',
    kol_boost: 'KOL Profile Boost (30 days)',
};
