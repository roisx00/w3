import { db } from './firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export const BADGE_FREE_LIMIT = 30;
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
