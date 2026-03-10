export type UserRole =
    | 'Ambassador'
    | 'Moderator'
    | 'Community Manager'
    | 'Project Manager'
    | 'Designer'
    | 'Developer'
    | 'Marketing'
    | 'Researcher';

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
    profileScore?: number;      // 0–60, computed from profile completeness
    reputationScore?: number;   // 0–100, blend of profileScore + reviews
    reviewCount?: number;
    referredBy?: string;        // userId of referrer
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
