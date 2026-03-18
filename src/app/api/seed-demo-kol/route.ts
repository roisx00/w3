import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// One-time seed endpoint — disabled in production
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
    }
    if (!adminDb) return NextResponse.json({ error: 'adminDb not initialized' }, { status: 500 });

    const demoKOLs = [
        {
            id: 'demo_alexmoon',
            displayName: 'Alex Moon',
            username: 'alexmoonweb3',
            tagline: 'DeFi Alpha Caller · 340K+ reach · 4 years in Web3',
            bio: "I've been calling DeFi gems since 2020. From early Uniswap liquidity plays to zkSync airdrop strategies — if it's on-chain, I'm covering it. My community trusts me because I always show receipts. No paid pumps, only real alpha.",
            photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alexmoon&backgroundColor=b6e3f4&radius=50',
            walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            niches: ['DeFi', 'Layer 2', 'Trading'],
            contentTypes: ['Threads', 'Alpha Calls', 'Spaces', 'Newsletters'],
            languages: ['English', 'Spanish'],
            platforms: {
                twitter: { handle: 'alexmoonweb3', followers: 182000, engagementRate: 3.8 },
                youtube: { handle: 'alexmoonweb3', subscribers: 48000 },
                telegram: { handle: 'alexmoonalpha', members: 21000 },
                discord: { handle: 'AlphaMoon DAO', members: 9400 },
            },
            totalReach: 260400,
            campaigns: [
                { id: '1', projectName: 'Arbitrum', type: 'Twitter Thread', result: '1.2M impressions · 18K retweets', year: '2023', proofUrl: 'https://x.com' },
                { id: '2', projectName: 'zkSync Era', type: 'Alpha Call', result: '42K wallets bridged within 24h', year: '2023' },
                { id: '3', projectName: 'Pendle Finance', type: 'YouTube Review', result: '95K views · featured by team', year: '2024' },
                { id: '4', projectName: 'EigenLayer', type: 'Spaces Host', result: '8,200 live listeners', year: '2024' },
            ],
            openToCollabs: true, minBudget: 1500, verified: true, kolBoosted: true, hasBadge: true,
            reputationScore: 94, reviewCount: 12, views: 3847,
        },
        {
            id: 'demo_sakuranft',
            displayName: 'Sakura.eth',
            username: 'sakuranft',
            tagline: 'NFT Alpha · Art Collector · 180K reach · Tokyo-based',
            bio: "Building the bridge between traditional art and Web3 since 2021. I cover blue-chip NFT launches, emerging artists, and market analysis. Featured in CoinDesk, Decrypt. My audience: serious collectors and flippers.",
            photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sakura&backgroundColor=ffdfbf&radius=50',
            walletAddress: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
            niches: ['NFTs', 'Gaming', 'DAOs'],
            contentTypes: ['Reviews', 'Threads', 'Tutorials', 'Shorts'],
            languages: ['English', 'Japanese'],
            platforms: {
                twitter: { handle: 'sakuranft', followers: 97000, engagementRate: 5.2 },
                youtube: { handle: 'sakuranft', subscribers: 31000 },
                tiktok: { handle: 'sakuranft', followers: 54000 },
                telegram: { handle: 'sakuraalpha', members: 8200 },
            },
            totalReach: 190200,
            campaigns: [
                { id: '1', projectName: 'Azuki', type: 'Twitter Thread', result: '800K impressions · sold out mint', year: '2022' },
                { id: '2', projectName: 'Pudgy Penguins', type: 'YouTube Review', result: '120K views', year: '2023' },
                { id: '3', projectName: 'Courtyard.io', type: 'TikTok Video', result: '2.1M views · viral', year: '2024' },
                { id: '4', projectName: 'Magic Eden', type: 'Tutorial', result: '45K views · official partnership', year: '2024' },
            ],
            openToCollabs: true, minBudget: 800, verified: true, kolBoosted: false, hasBadge: true,
            reputationScore: 89, reviewCount: 8, views: 2104,
        },
        {
            id: 'demo_cryptovince',
            displayName: 'Crypto Vince',
            username: 'cryptovince',
            tagline: 'Gaming & GameFi KOL · 500K+ community · 5 years building',
            bio: "Started as a gamer, became a Web3 native. I cover play-to-earn, GameFi tokenomics, and metaverse projects. My Telegram has 85K+ active members. I only shill what I actually play and believe in.",
            photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=vince&backgroundColor=c0aede&radius=50',
            walletAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            niches: ['Gaming', 'AI x Crypto', 'Memes'],
            contentTypes: ['Tutorials', 'Reviews', 'YouTube Videos', 'AMAs', 'Shorts'],
            languages: ['English', 'Portuguese', 'Spanish'],
            platforms: {
                twitter: { handle: 'cryptovince', followers: 143000, engagementRate: 2.9 },
                youtube: { handle: 'CryptoVince', subscribers: 89000 },
                telegram: { handle: 'cryptovince_calls', members: 85000 },
                tiktok: { handle: 'cryptovince', followers: 210000 },
                discord: { handle: 'Vince Gaming DAO', members: 22000 },
            },
            totalReach: 549000,
            campaigns: [
                { id: '1', projectName: 'Illuvium', type: 'YouTube Review', result: '310K views · #1 trending crypto', year: '2022' },
                { id: '2', projectName: 'Axie Infinity', type: 'Tutorial', result: '580K views total series', year: '2022' },
                { id: '3', projectName: 'Pixels', type: 'AMA', result: '12K live, 200K replay views', year: '2023' },
                { id: '4', projectName: 'Ronin Network', type: 'Twitter Thread', result: '2.4M impressions', year: '2024' },
                { id: '5', projectName: 'Xai Games', type: 'YouTube Review', result: '95K views · ambassador deal', year: '2024' },
            ],
            openToCollabs: false, minBudget: 3000, verified: true, kolBoosted: true, hasBadge: true,
            reputationScore: 91, reviewCount: 19, views: 6230,
        },
        {
            id: 'demo_0xresearcher',
            displayName: '0xResearcher',
            username: '0xresearcher',
            tagline: 'Infrastructure · L2s · Deep Dives · No hype, just data',
            bio: "Ex-engineer turned full-time crypto researcher. I write 5,000-word deep dives on infrastructure protocols, L2 scaling, and tokenomics. If you want to understand a protocol from first principles, my threads are for you.",
            photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=researcher&backgroundColor=d1d4f9&radius=50',
            walletAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            niches: ['Infrastructure', 'Layer 2', 'DeFi', 'Education'],
            contentTypes: ['Threads', 'Newsletters', 'Tutorials'],
            languages: ['English'],
            platforms: {
                twitter: { handle: '0xresearcher', followers: 68000, engagementRate: 7.1 },
                telegram: { handle: '0xresearch', members: 14000 },
            },
            totalReach: 82000,
            campaigns: [
                { id: '1', projectName: 'Optimism', type: 'Twitter Thread', result: '3.1M impressions · retweeted by Vitalik', year: '2023' },
                { id: '2', projectName: 'Celestia', type: 'Newsletter', result: '92% open rate · 28K readers', year: '2023' },
                { id: '3', projectName: 'EigenLayer', type: 'Threads', result: '1.8M impressions · cited by team', year: '2024' },
            ],
            openToCollabs: true, minBudget: 500, verified: false, kolBoosted: false, hasBadge: true,
            reputationScore: 87, reviewCount: 5, views: 1842,
        },
        {
            id: 'demo_tradingmaya',
            displayName: 'Maya Trades',
            username: 'tradingmaya',
            tagline: 'On-chain analyst · Perps trader · 95K following · signals daily',
            bio: "Full-time trader and on-chain analyst. I share live trade setups, wallet tracking insights, and market structure analysis every day. My community has been profitable 3 years running. Transparent PnL always posted.",
            photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=maya&backgroundColor=ffd5dc&radius=50',
            walletAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
            niches: ['Trading', 'DeFi', 'AI x Crypto'],
            contentTypes: ['Alpha Calls', 'Threads', 'Spaces', 'Newsletters'],
            languages: ['English', 'Arabic', 'Turkish'],
            platforms: {
                twitter: { handle: 'tradingmaya', followers: 95000, engagementRate: 4.4 },
                telegram: { handle: 'mayasignals', members: 38000 },
                discord: { handle: 'Maya Trading Hub', members: 11000 },
            },
            totalReach: 144000,
            campaigns: [
                { id: '1', projectName: 'GMX', type: 'Alpha Call', result: '340% ROI for followers in 30 days', year: '2023' },
                { id: '2', projectName: 'Hyperliquid', type: 'Twitter Thread', result: '900K impressions · top perps thread of 2024', year: '2024' },
                { id: '3', projectName: 'dYdX', type: 'Spaces Host', result: '5,400 live · official partnership', year: '2024' },
            ],
            openToCollabs: true, minBudget: 1000, verified: true, kolBoosted: false, hasBadge: true,
            reputationScore: 92, reviewCount: 14, views: 4511,
        },
    ];

    try {
        const batch = adminDb.batch();
        for (const kol of demoKOLs) {
            const { id, ...data } = kol;
            batch.set(adminDb.collection('kols').doc(id), {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        await batch.commit();
        return NextResponse.json({ success: true, count: demoKOLs.length, ids: demoKOLs.map(k => k.id) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
