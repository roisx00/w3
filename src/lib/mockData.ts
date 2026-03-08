import { TalentProfile, JobPosting, Airdrop } from './types';

export const mockTalents: TalentProfile[] = [
    {
        id: '1',
        username: 'vitalik.eth',
        displayName: 'Vitalik Buterin',
        bio: 'Founder of Ethereum. Interested in cryptography, decentralized systems, and game theory.',
        walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        socials: { twitter: '@vitalikbuterin' },
        roles: ['Developer', 'Researcher'],
        skills: ['Solidity', 'Rust', 'EVM', 'ZK-Proofs'],
        experience: [
            {
                id: 'e1',
                projectName: 'Ethereum Foundation',
                role: 'Core Researcher',
                duration: '2014 - Present',
                responsibilities: 'Designing the consensus layer and scalability solutions.'
            }
        ],
        availability: 'Full-time'
    },
    {
        id: '2',
        username: 'satoshi_n',
        displayName: 'Satoshi Nakamoto',
        bio: 'Digital gold architect. Expert in P2P networks and economic incentives.',
        walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        socials: { twitter: '@satoshi' },
        roles: ['Developer', 'Researcher'],
        skills: ['C++', 'Cryptography', 'P2P'],
        experience: [],
        availability: 'Full-time'
    }
];

export const mockJobs: JobPosting[] = [
    {
        id: 'j1',
        projectName: 'ZkSync',
        roleNeeded: 'Senior Solidity Engineer',
        description: 'Help us build the most scalable L2 on Ethereum using ZK-rollups.',
        website: 'https://zksync.io',
        twitter: '@zksync',
        experienceLevel: 'Senior',
        paymentConfig: { type: 'Salary', amount: '120k - 180k', currency: 'USDC' },
        duration: 'Full-time',
        isRemote: true,
        status: 'Open'
    },
    {
        id: 'j2',
        projectName: 'Uniswap Labs',
        roleNeeded: 'Protocol Architect',
        description: 'Design the next generation of decentralized liquidity protocols.',
        website: 'https://uniswap.org',
        twitter: '@Uniswap',
        experienceLevel: 'Lead',
        paymentConfig: { type: 'Salary', amount: '200k+', currency: 'USDC' },
        duration: 'Full-time',
        isRemote: true,
        status: 'Open'
    }
];

export const mockAirdrops: Airdrop[] = [
    {
        id: 'a1',
        projectName: 'LayerZero',
        description: 'Omnichain interoperability protocol connecting various blockchains.',
        blockchain: 'Multichain',
        potentialReward: '$500 - $5,000',
        status: 'Live',
        type: 'Confirmed',
        difficulty: 'Medium',
        participationCount: '1.2M+',
        fundingAmount: '$263M',
        website: 'https://layerzero.network',
        twitter: '@LayerZero_Labs',
        tasks: [
            'Use Stargate Bridge',
            'Vote on Snapshot proposals',
            'Interact with LiquidSwap'
        ]
    },
    {
        id: 'a2',
        projectName: 'Berachain',
        description: 'DeFi-focused L1 blockchain built on Cosmos SDK.',
        blockchain: 'Berachain',
        potentialReward: '$1,000 - $10,000',
        status: 'Upcoming',
        type: 'Potential',
        difficulty: 'Hard',
        participationCount: '800k+',
        fundingAmount: '$42M',
        website: 'https://berachain.com',
        twitter: '@berachain',
        tasks: [
            'Melt "Bera" NFTs',
            'Interact with Testnet DEX',
            'Join Discord and get roles'
        ]
    }
];
