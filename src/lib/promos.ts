import { db } from './firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import type { TalentProfile } from './types';

// Compute a base resume score (0–60) from profile completeness & quality
export function computeProfileScore(p: Partial<TalentProfile>): number {
    let score = 0;
    if (p.displayName?.trim()) score += 5;
    if (p.bio && p.bio.length > 60) score += 8;
    if (p.bio && p.bio.length > 160) score += 4;   // extra for detailed bio
    if (p.walletAddress?.trim()) score += 5;
    if (p.socials?.twitter?.trim()) score += 4;
    if (p.photoUrl?.trim()) score += 8;             // has profile photo
    const roles = p.roles?.length ?? 0;
    score += Math.min(roles * 3, 9);                // up to 3 roles × 3pts
    const skills = p.skills?.length ?? 0;
    score += skills >= 8 ? 8 : skills >= 4 ? 4 : 0;
    const exp = p.experience?.length ?? 0;
    score += Math.min(exp * 5, 15);                 // up to 3 exp × 5pts
    // max possible: 5+8+4+5+4+8+9+8+15 = 66 → cap at 60
    return Math.min(Math.round(score), 60);
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
