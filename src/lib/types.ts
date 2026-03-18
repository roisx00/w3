export type UserRole =
    | 'Ambassador'
    | 'Moderator'
    | 'Community Manager'
    | 'Project Manager'
    | 'Designer'
    | 'Developer'
    | 'Marketing'
    | 'Researcher'
    | 'Founder';

export interface Experience {
    id: string;
    projectName: string;
    role: string;
    duration: string;
    responsibilities: string;
    proofLinks?: string[];
}

export interface TalentProfile {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    photoUrl?: string;
    email?: string;
    walletAddress: string;
    isAdmin?: boolean;
    verified?: boolean;
    socials: {
        twitter?: string;
        discord?: string;
        telegram?: string;
        github?: string;
        portfolio?: string;
    };
    githubStats?: {
        repos: number;
        stars: number;
        followers: number;
        verifiedAt: string;
    };
    roles: UserRole[];
    skills: string[];
    experience: Experience[];
    availability: 'Full-time' | 'Part-time' | 'Freelance';
    resumeUrl?: string;
    hasBadge?: boolean;
    hasBadgePending?: boolean;
    badgeTxHash?: string;
    cvBoosted?: boolean;
    cvBoostExpiry?: string;
    openToWork?: boolean;
    score?: number;             // Legacy score logic, moving to profileScore/reputationScore
    profileScore?: number;      // 0–80, computed from profile completeness
    reputationScore?: number;   // 0–100, blend of profileScore + reviews
    reviewCount?: number;
    referredBy?: string;        // userId of referrer
    views?: number;
    isFounderVerified?: boolean;
    savedResumes?: string[];
}

export interface ReferralEarning {
    id: string;
    referrerId: string;
    referrerName: string;
    refereeId: string;
    refereeName: string;
    paymentType: string;
    originalAmount: number;
    earning: number;            // 10% of originalAmount
    txHash: string;
    status: 'pending';          // admin pays out in USDC
    createdAt?: any;
}

export interface Review {
    id: string;            // = reviewerId (one review per person per talent)
    reviewerId: string;
    reviewerName: string;
    reviewerPhotoUrl?: string;
    reviewerUsername?: string;
    rating: number;        // 1–5
    text: string;
    createdAt?: any;
}

export interface JobPosting {
    id: string;
    projectName: string;
    logoUrl?: string;
    website: string;
    twitter: string;
    roleNeeded: string;
    description: string;
    experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead';
    paymentConfig: {
        type: 'Salary' | 'Token' | 'Revenue Share' | 'Volunteer';
        amount?: string;
        currency?: string;
    };
    duration: string;
    isRemote: boolean;
    status: 'Open' | 'Closed';
    postedBy?: string;
    verified?: boolean;
    featured?: boolean;
    createdAt?: any;
    paymentStatus?: 'pending' | 'verified' | 'rejected';
    paymentTxHash?: string;
    boosted?: boolean;
    boostExpiry?: string;
}

export interface Airdrop {
    id: string;
    projectName: string;
    logoUrl?: string;
    description: string;
    website: string;
    twitter: string;
    blockchain: string;
    potentialReward: string;
    fundingAmount?: string;
    status: 'Live' | 'Upcoming' | 'Ended';
    type: 'Confirmed' | 'Potential';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    participationCount: string;
    tasks: Array<{ text: string; url?: string; linkText?: string; imageUrl?: string } | string>; // Supported simple string or object with link/image
    taskImages?: string[]; // Optional screenshot per task (parallel array) - deprecated, moving to per-task object
    featured?: boolean;
    createdAt?: any;
    updatedAt?: any;
    paymentStatus?: 'pending' | 'verified' | 'rejected';
    paymentTxHash?: string;
    boosted?: boolean;
    boostExpiry?: string;
}

export interface PaymentRecord {
    id: string;
    userId: string;
    userEmail: string;
    userDisplayName: string;
    type: 'job_post' | 'airdrop_post' | 'user_badge' | 'cv_boost' | 'job_boost';
    amount: number;
    txHash: string;
    status: 'pending' | 'verified' | 'rejected';
    refId?: string;
    refName?: string;
    createdAt?: any;
}

export type KOLNiche =
    | 'DeFi'
    | 'NFTs'
    | 'Gaming'
    | 'Layer 2'
    | 'AI x Crypto'
    | 'Memes'
    | 'Infrastructure'
    | 'DAOs'
    | 'Trading'
    | 'Education';

export type ContentType =
    | 'Threads'
    | 'Reviews'
    | 'Tutorials'
    | 'AMAs'
    | 'Alpha Calls'
    | 'Spaces'
    | 'Shorts'
    | 'YouTube Videos'
    | 'Newsletters';

export interface KOLCampaign {
    id: string;
    projectName: string;
    type: string;         // e.g. "Twitter Thread", "YouTube Review"
    result?: string;      // e.g. "500K impressions", "2x token price"
    year?: string;
    proofUrl?: string;
}

export interface KOLProfile {
    id: string;                     // Privy DID
    username: string;
    displayName: string;
    bio: string;
    tagline?: string;               // Short headline, e.g. "DeFi Alpha Caller · 200K+ reach"
    photoUrl?: string;
    walletAddress?: string;
    niches: KOLNiche[];
    contentTypes: ContentType[];
    languages: string[];
    platforms: {
        twitter?: { handle: string; followers: number; engagementRate?: number };
        youtube?: { handle: string; subscribers: number };
        telegram?: { handle: string; members: number };
        tiktok?: { handle: string; followers: number };
        discord?: { handle: string; members: number };
        instagram?: { handle: string; followers: number };
    };
    totalReach?: number;            // auto-computed sum
    campaigns: KOLCampaign[];
    minBudget?: number;             // min USD per campaign
    openToCollabs: boolean;
    verified?: boolean;             // admin verified
    kolBoosted?: boolean;
    kolBoostExpiry?: string;
    hasBadge?: boolean;             // paid $5 KOL badge
    hasBadgePending?: boolean;
    badgeTxHash?: string;
    profileScore?: number;
    reputationScore?: number;
    reviewCount?: number;
    createdAt?: any;
    updatedAt?: any;
    views?: number;
}

export interface Conversation {
    id: string;
    participants: string[];
    participantDetails: {
        [uid: string]: {
            displayName: string;
            photoUrl?: string;
            username: string;
        }
    };
    lastMessage?: string;
    lastMessageAt?: any;
    unreadCount: { [uid: string]: number };
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    createdAt: any;
}
