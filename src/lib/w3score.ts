import { KOLProfile, TalentProfile } from './types';

export interface W3ScoreTier {
    label: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
}

export const W3_TIERS: W3ScoreTier[] = [
    {
        label: 'Newcomer',
        color: 'text-foreground/40',
        bg: 'bg-white/5',
        border: 'border-white/10',
        glow: '',
    },
    {
        label: 'Rising',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        glow: '0 0 20px rgba(59,130,246,0.2)',
    },
    {
        label: 'Established',
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        glow: '0 0 20px rgba(124,58,237,0.25)',
    },
    {
        label: 'Elite',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        glow: '0 0 24px rgba(245,158,11,0.3)',
    },
    {
        label: 'Legend',
        color: 'text-orange-400',
        bg: 'bg-gradient-to-r from-amber-500/10 to-pink-500/10',
        border: 'border-amber-400/30',
        glow: '0 0 32px rgba(245,158,11,0.4)',
    },
];

export function getW3Tier(score: number): W3ScoreTier {
    if (score >= 801) return W3_TIERS[4]; // Legend
    if (score >= 601) return W3_TIERS[3]; // Elite
    if (score >= 401) return W3_TIERS[2]; // Established
    if (score >= 201) return W3_TIERS[1]; // Rising
    return W3_TIERS[0];                   // Newcomer
}

// ─── W3 Score: 0–1000 ──────────────────────────────────────────────────────
// ~70% weight from X/Twitter, rest from cross-platform + track record
export function computeW3Score(kol: KOLProfile): number {
    let score = 0;

    // ── 1. X/Twitter Followers (max 400) ──────────────────────────────────
    const followers = kol.platforms?.twitter?.followers ?? 0;
    if      (followers >= 1_000_000) score += 400;
    else if (followers >= 500_000)   score += 360;
    else if (followers >= 200_000)   score += 310;
    else if (followers >= 100_000)   score += 250;
    else if (followers >= 50_000)    score += 190;
    else if (followers >= 20_000)    score += 140;
    else if (followers >= 10_000)    score += 100;
    else if (followers >= 5_000)     score += 65;
    else if (followers >= 1_000)     score += 35;
    else if (followers >= 100)       score += 15;
    else if (followers > 0)          score += 5;

    // ── 2. X/Twitter Engagement Rate (max 250) ────────────────────────────
    const eng = kol.platforms?.twitter?.engagementRate ?? 0;
    if      (eng >= 10)  score += 250;
    else if (eng >= 7)   score += 210;
    else if (eng >= 5)   score += 170;
    else if (eng >= 3)   score += 130;
    else if (eng >= 2)   score += 90;
    else if (eng >= 1)   score += 50;
    else if (eng >= 0.5) score += 20;
    else if (eng > 0)    score += 5;

    // ── 3. X/Twitter Verified badge (max 50) ──────────────────────────────
    if (kol.verified) score += 50;

    // ── 4. Cross-platform presence (max 150) ──────────────────────────────
    // Count platforms OTHER than Twitter with real audience
    const extraPlatforms = Object.entries(kol.platforms || {}).filter(([key, p]: [string, any]) => {
        if (key === 'twitter') return false;
        return p && (p.followers > 0 || p.subscribers > 0 || p.members > 0);
    }).length;
    if      (extraPlatforms >= 5) score += 150;
    else if (extraPlatforms === 4) score += 130;
    else if (extraPlatforms === 3) score += 100;
    else if (extraPlatforms === 2) score += 65;
    else if (extraPlatforms === 1) score += 30;

    // ── 5. Past collaborations (max 75) ───────────────────────────────────
    const collabCount = kol.campaigns?.length ?? 0;
    if      (collabCount >= 10) score += 75;
    else if (collabCount >= 7)  score += 60;
    else if (collabCount >= 5)  score += 48;
    else if (collabCount >= 3)  score += 35;
    else if (collabCount >= 2)  score += 22;
    else if (collabCount === 1) score += 10;

    // ── 6. Profile completeness (max 75) ──────────────────────────────────
    if (kol.bio?.trim())         score += 15;
    if (kol.photoUrl?.trim())    score += 15;
    if (kol.tagline?.trim())     score += 15;
    if (kol.walletAddress?.trim()) score += 10;
    if (kol.campaigns?.some(c => c.proofUrl)) score += 20;

    return Math.min(1000, Math.max(0, score));
}

// Score breakdown for tooltip/info display
export function getW3ScoreBreakdown(kol: KOLProfile) {
    const followers = kol.platforms?.twitter?.followers ?? 0;
    const eng = kol.platforms?.twitter?.engagementRate ?? 0;

    let followersScore = 0;
    if      (followers >= 1_000_000) followersScore = 400;
    else if (followers >= 500_000)   followersScore = 360;
    else if (followers >= 200_000)   followersScore = 310;
    else if (followers >= 100_000)   followersScore = 250;
    else if (followers >= 50_000)    followersScore = 190;
    else if (followers >= 20_000)    followersScore = 140;
    else if (followers >= 10_000)    followersScore = 100;
    else if (followers >= 5_000)     followersScore = 65;
    else if (followers >= 1_000)     followersScore = 35;
    else if (followers >= 100)       followersScore = 15;
    else if (followers > 0)          followersScore = 5;

    let engScore = 0;
    if      (eng >= 10)  engScore = 250;
    else if (eng >= 7)   engScore = 210;
    else if (eng >= 5)   engScore = 170;
    else if (eng >= 3)   engScore = 130;
    else if (eng >= 2)   engScore = 90;
    else if (eng >= 1)   engScore = 50;
    else if (eng >= 0.5) engScore = 20;
    else if (eng > 0)    engScore = 5;

    const verifiedScore = kol.verified ? 50 : 0;

    const extraPlatforms = Object.entries(kol.platforms || {}).filter(([key, p]: [string, any]) => {
        if (key === 'twitter') return false;
        return p && (p.followers > 0 || p.subscribers > 0 || p.members > 0);
    }).length;
    let platformScore = 0;
    if      (extraPlatforms >= 5)  platformScore = 150;
    else if (extraPlatforms === 4) platformScore = 130;
    else if (extraPlatforms === 3) platformScore = 100;
    else if (extraPlatforms === 2) platformScore = 65;
    else if (extraPlatforms === 1) platformScore = 30;

    const collabCount = kol.campaigns?.length ?? 0;
    let collabScore = 0;
    if      (collabCount >= 10) collabScore = 75;
    else if (collabCount >= 7)  collabScore = 60;
    else if (collabCount >= 5)  collabScore = 48;
    else if (collabCount >= 3)  collabScore = 35;
    else if (collabCount >= 2)  collabScore = 22;
    else if (collabCount === 1) collabScore = 10;

    let profileScore = 0;
    if (kol.bio?.trim())         profileScore += 15;
    if (kol.photoUrl?.trim())    profileScore += 15;
    if (kol.tagline?.trim())     profileScore += 15;
    if (kol.walletAddress?.trim()) profileScore += 10;
    if (kol.campaigns?.some(c => c.proofUrl)) profileScore += 20;

    return [
        { label: 'X Followers', score: followersScore, max: 400 },
        { label: 'X Engagement', score: engScore, max: 250 },
        { label: 'X Verified', score: verifiedScore, max: 50 },
        { label: 'Multi-platform', score: platformScore, max: 150 },
        { label: 'Collaborations', score: collabScore, max: 75 },
        { label: 'Profile', score: profileScore, max: 75 },
    ];
}

// ─── Talent W3 Score: 0–1000 ───────────────────────────────────────────────
export function computeTalentW3Score(talent: TalentProfile): number {
    let score = 0;

    // Verified badge (paid) — biggest signal of commitment
    if ((talent as any).hasBadge)       score += 200;
    if ((talent as any).cvBoosted)      score += 100;

    // Profile completeness
    if (talent.bio?.trim().length > 50) score += 80;
    else if (talent.bio?.trim())        score += 40;
    if (talent.photoUrl?.trim())        score += 60;
    if ((talent as any).resumeUrl?.trim()) score += 80;
    if (talent.walletAddress?.trim())   score += 50;

    // Social presence
    if (talent.socials?.twitter?.trim()) score += 40;
    if ((talent as any).githubStats)     score += 30;
    if (talent.socials?.telegram?.trim()) score += 20;

    // Roles & skills depth
    const roleCount = talent.roles?.length ?? 0;
    if (roleCount >= 3)      score += 40;
    else if (roleCount >= 1) score += 20;

    const skillCount = talent.skills?.length ?? 0;
    if (skillCount >= 8)      score += 60;
    else if (skillCount >= 5) score += 40;
    else if (skillCount >= 2) score += 20;

    // Experience
    const expCount = (talent as any).experience?.length ?? 0;
    if (expCount >= 3)      score += 120;
    else if (expCount >= 2) score += 80;
    else if (expCount >= 1) score += 40;

    // Availability signal
    if ((talent as any).openToWork) score += 20;

    // Profile views (organic reputation signal)
    const views = (talent as any).views ?? 0;
    if (views >= 500)      score += 60;
    else if (views >= 200) score += 40;
    else if (views >= 50)  score += 20;

    return Math.min(1000, Math.max(0, score));
}
