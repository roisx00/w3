import { db } from './firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import type { TalentProfile } from './types';

// Compute a base resume score (0–80) from profile completeness & quality
// Reviews can push the final reputationScore ±20 from this base
export function computeProfileScore(p: Partial<TalentProfile>): number {
    let score = 0;
    if (p.displayName?.trim()) score += 6;
    if (p.bio && p.bio.length > 60) score += 10;
    if (p.bio && p.bio.length > 160) score += 5;   // extra for detailed bio
    if (p.walletAddress?.trim()) score += 6;
    if (p.socials?.twitter?.trim()) score += 5;
    if (p.photoUrl?.trim()) score += 10;            // has profile photo
    const roles = p.roles?.length ?? 0;
    score += Math.min(roles * 4, 12);               // up to 3 roles × 4pts
    const skills = p.skills?.length ?? 0;
    score += skills >= 8 ? 10 : skills >= 4 ? 5 : 0;
    const exp = p.experience?.length ?? 0;
    score += Math.min(exp * 6, 18);                 // up to 3 exp × 6pts
    // max possible: 6+10+5+6+5+10+12+10+18 = 82 → cap at 80
    return Math.min(Math.round(score), 80);
}

export const BADGE_FREE_LIMIT = 0;
export const JOB_FREE_LIMIT = 50;

export async function checkBadgePromo(): Promise<{ isFree: boolean; remaining: number }> {
    const snap = await getCountFromServer(query(collection(db, 'talents'), where('hasBadge', '==', true)));
    const count = snap.data().count;
    return { isFree: count < BADGE_FREE_LIMIT, remaining: Math.max(0, BADGE_FREE_LIMIT - count) };
}

export async function checkJobPromo(): Promise<{ isFree: boolean; remaining: number }> {
    const snap = await getCountFromServer(collection(db, 'jobs'));
    const count = snap.data().count;
    return { isFree: count < JOB_FREE_LIMIT, remaining: Math.max(0, JOB_FREE_LIMIT - count) };
}
