'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TalentProfile } from '@/lib/types';
import { computeProfileScore } from '@/lib/promos';
import { db, auth } from '@/lib/firebase';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    onSnapshot,
    query,
    where,
} from 'firebase/firestore';
import { startXLogin, handleXCallback, XUser } from '@/lib/xAuth';

interface AppState {
    user: TalentProfile | null;
    isLoggedIn: boolean;
    authLoading: boolean;
    bookmarkedJobs: string[];
    trackedAirdrops: string[];
    savedResumes: string[];
    hasKolBadge: boolean;
    login: () => void;
    logout: () => void;
    toggleBookmarkJob: (jobId: string) => void;
    toggleTrackAirdrop: (airdropId: string) => void;
    toggleSaveResume: (talentId: string) => void;
    updateProfile: (profile: Partial<TalentProfile>) => void;
    logReferralEarning: (paymentType: string, amount: number, txHash: string, payer: TalentProfile) => Promise<void>;
    unreadMessagesCount: number;
    getAccessToken: () => Promise<string | null>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<TalentProfile | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
    const [trackedAirdrops, setTrackedAirdrops] = useState<string[]>([]);
    const [savedResumes, setSavedResumes] = useState<string[]>([]);
    const [hasKolBadge, setHasKolBadge] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Returns a fresh Firebase ID token for authenticated API calls
    const getAccessToken = async (): Promise<string | null> => {
        if (!auth?.currentUser) return null;
        try { return await auth.currentUser.getIdToken(); } catch { return null; }
    };

    // Load Firestore profile after X auth
    const loadFirestoreProfile = async (uid: string, xUser: XUser) => {
        const shellUser: TalentProfile = {
            id: uid,
            email: '',
            username: xUser.username,
            displayName: xUser.name || xUser.username,
            photoUrl: xUser.avatar || '',
            walletAddress: '',
            roles: [],
            skills: [],
            experience: [],
            availability: 'Full-time',
            bio: '',
            socials: { twitter: `@${xUser.username}` },
        } as any;

        try {
            const [docSnap, kolSnap] = await Promise.all([
                getDoc(doc(db, 'talents', uid)),
                getDoc(doc(db, 'kols', uid)),
            ]);

            setHasKolBadge(!!(kolSnap.exists() && kolSnap.data()?.hasBadge));

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUser({ ...data, id: uid } as TalentProfile);
                if (Array.isArray(data.bookmarkedJobs)) {
                    setBookmarkedJobs(data.bookmarkedJobs);
                    localStorage.setItem('hub_bookmarked_jobs', JSON.stringify(data.bookmarkedJobs));
                }
                if (Array.isArray(data.trackedAirdrops)) {
                    setTrackedAirdrops(data.trackedAirdrops);
                    localStorage.setItem('hub_tracked_airdrops', JSON.stringify(data.trackedAirdrops));
                }
                if (Array.isArray(data.savedResumes)) {
                    setSavedResumes(data.savedResumes);
                    localStorage.setItem('hub_saved_resumes', JSON.stringify(data.savedResumes));
                }
            } else {
                // New user — seed profile + capture referral
                const refCode = typeof window !== 'undefined' ? localStorage.getItem('hub_ref') : null;
                const seedData: any = { ...shellUser, createdAt: serverTimestamp() };
                if (refCode && refCode !== uid) {
                    seedData.referredBy = refCode;
                    localStorage.removeItem('hub_ref');
                }
                await setDoc(doc(db, 'talents', uid), seedData, { merge: true });
                setUser(shellUser);
            }
        } catch (e) {
            console.warn('[AppContext] Firestore unavailable, using shell user:', e);
            setUser(shellUser);
        }
        setAuthLoading(false);
    };

    // Sign in to Firebase with X access token, get custom token, load profile
    const signInAndLoad = async (xUser: XUser) => {
        const uid = `tw_${xUser.id}`;
        const xToken = localStorage.getItem('x_access_token');

        try {
            if (xToken && auth) {
                const res = await fetch('/api/firebase-auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${xToken}`,
                    },
                    body: JSON.stringify({ uid }),
                });
                if (res.ok) {
                    const { customToken } = await res.json();
                    if (customToken) await signInWithCustomToken(auth, customToken);
                }
            }
        } catch (e) {
            console.warn('[AppContext] Firebase sign-in failed, continuing without Firebase Auth:', e);
        }

        await loadFirestoreProfile(uid, xUser);
    };

    // On mount: handle OAuth callback or restore from Firebase Auth session
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            // 1. Check for OAuth callback (?code=...&state=...)
            if (typeof window !== 'undefined' && window.location.search.includes('code=') && window.location.search.includes('state=')) {
                const xUser = await handleXCallback();
                if (!cancelled && xUser) {
                    await signInAndLoad(xUser);
                    return;
                }
            }

            // 2. Restore session via Firebase Auth state + stored X token
            if (!auth) {
                setAuthLoading(false);
                return;
            }

            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (cancelled) return;

                if (!firebaseUser) {
                    setUser(null);
                    setAuthLoading(false);
                    return;
                }

                // Firebase user exists — restore X user info
                const xToken = localStorage.getItem('x_access_token');
                if (!xToken) {
                    setUser(null);
                    setAuthLoading(false);
                    return;
                }

                try {
                    const r = await fetch('/api/x-me', {
                        headers: { Authorization: `Bearer ${xToken}` },
                    });
                    if (r.ok) {
                        const xUser: XUser = await r.json();
                        await loadFirestoreProfile(`tw_${xUser.id}`, xUser);
                    } else {
                        // X token expired/revoked — clear everything
                        localStorage.removeItem('x_access_token');
                        setUser(null);
                        setAuthLoading(false);
                    }
                } catch {
                    setUser(null);
                    setAuthLoading(false);
                }
            });

            return () => unsubscribe();
        };

        init();
        return () => { cancelled = true; };
    }, []);

    // Monitor unread messages
    useEffect(() => {
        if (!user?.id) { setUnreadMessagesCount(0); return; }
        const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.id));
        const unsubscribe = onSnapshot(q, (snap) => {
            let total = 0;
            snap.docs.forEach(d => { total += (d.data().unreadCount?.[user.id!] || 0); });
            setUnreadMessagesCount(total);
        }, () => {});
        return () => unsubscribe();
    }, [user?.id]);

    // Persist bookmarks/tracking to localStorage
    useEffect(() => { localStorage.setItem('hub_bookmarked_jobs', JSON.stringify(bookmarkedJobs)); }, [bookmarkedJobs]);
    useEffect(() => { localStorage.setItem('hub_tracked_airdrops', JSON.stringify(trackedAirdrops)); }, [trackedAirdrops]);
    useEffect(() => { localStorage.setItem('hub_saved_resumes', JSON.stringify(savedResumes)); }, [savedResumes]);

    const login = () => startXLogin();

    const logout = async () => {
        localStorage.removeItem('x_access_token');
        if (auth?.currentUser) {
            try { await auth.signOut(); } catch {}
        }
        setUser(null);
        setHasKolBadge(false);
        setBookmarkedJobs([]);
        setTrackedAirdrops([]);
        setSavedResumes([]);
    };

    const toggleBookmarkJob = (jobId: string) => {
        const next = bookmarkedJobs.includes(jobId)
            ? bookmarkedJobs.filter(id => id !== jobId)
            : [...bookmarkedJobs, jobId];
        setBookmarkedJobs(next);
        if (user?.id) setDoc(doc(db, 'talents', user.id), { bookmarkedJobs: next }, { merge: true }).catch(console.error);
    };

    const toggleTrackAirdrop = (airdropId: string) => {
        const next = trackedAirdrops.includes(airdropId)
            ? trackedAirdrops.filter(id => id !== airdropId)
            : [...trackedAirdrops, airdropId];
        setTrackedAirdrops(next);
        if (user?.id) setDoc(doc(db, 'talents', user.id), { trackedAirdrops: next }, { merge: true }).catch(console.error);
    };

    const toggleSaveResume = (talentId: string) => {
        const next = savedResumes.includes(talentId)
            ? savedResumes.filter(id => id !== talentId)
            : [...savedResumes, talentId];
        setSavedResumes(next);
        if (user?.id) setDoc(doc(db, 'talents', user.id), { savedResumes: next }, { merge: true }).catch(console.error);
    };

    const updateProfile = async (profile: Partial<TalentProfile>) => {
        if (!user?.id) return;
        const updated = { ...user, ...profile } as TalentProfile;
        setUser(updated);
        try {
            const saveData: any = {
                displayName: updated.displayName,
                username: updated.username,
                bio: updated.bio,
                roles: updated.roles,
                skills: updated.skills,
                experience: updated.experience || [],
                availability: updated.availability,
                socials: updated.socials || {},
                walletAddress: updated.walletAddress || '',
                photoUrl: updated.photoUrl || '',
                resumeUrl: updated.resumeUrl || '',
                updatedAt: serverTimestamp(),
                profileScore: computeProfileScore(updated),
                ...(!updated.reviewCount ? { reputationScore: computeProfileScore(updated) } : {}),
            };
            if (profile.hasBadge !== undefined) saveData.hasBadge = profile.hasBadge;
            if (profile.hasBadgePending !== undefined) saveData.hasBadgePending = profile.hasBadgePending;
            if (profile.badgeTxHash !== undefined) saveData.badgeTxHash = profile.badgeTxHash;
            if (profile.cvBoosted !== undefined) saveData.cvBoosted = profile.cvBoosted;
            if (profile.cvBoostExpiry !== undefined) saveData.cvBoostExpiry = profile.cvBoostExpiry;
            if (profile.openToWork !== undefined) saveData.openToWork = profile.openToWork;
            await setDoc(doc(db, 'talents', user.id), saveData, { merge: true });
        } catch (e) {
            console.error('[AppContext] Firestore sync error:', e);
        }
    };

    const logReferralEarning = async (paymentType: string, originalAmount: number, txHash: string, payer: TalentProfile) => {
        if (!payer.referredBy) return;
        try {
            const referrerDoc = await getDoc(doc(db, 'talents', payer.referredBy));
            if (!referrerDoc.exists()) return;
            const referrerData = referrerDoc.data();
            await addDoc(collection(db, 'referrals'), {
                referrerId: payer.referredBy,
                referrerName: referrerData.displayName || 'Unknown',
                refereeId: payer.id,
                refereeName: payer.displayName || 'Unknown',
                paymentType,
                originalAmount,
                earning: Math.round(originalAmount * 0.1 * 100) / 100,
                txHash,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
        } catch { /* silent */ }
    };

    return (
        <AppContext.Provider value={{
            user,
            isLoggedIn: !!user,
            authLoading,
            bookmarkedJobs,
            trackedAirdrops,
            savedResumes,
            hasKolBadge,
            login,
            logout,
            toggleBookmarkJob,
            toggleTrackAirdrop,
            toggleSaveResume,
            updateProfile,
            logReferralEarning,
            unreadMessagesCount,
            getAccessToken,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};
