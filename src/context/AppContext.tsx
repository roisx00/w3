'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { TalentProfile, JobPosting, Airdrop } from '@/lib/types';
import { computeProfileScore } from '@/lib/promos';
import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    onSnapshot,
    query,
    where
} from 'firebase/firestore';

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
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: privyUser, authenticated, ready, login, logout: privyLogout } = usePrivy();
    const { wallets } = useWallets();

    const [user, setUser] = useState<TalentProfile | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
    const [trackedAirdrops, setTrackedAirdrops] = useState<string[]>([]);
    const [savedResumes, setSavedResumes] = useState<string[]>([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [hasKolBadge, setHasKolBadge] = useState(false);

    // Monitor Privy auth state → load Firestore profile
    useEffect(() => {
        if (!ready) return;

        if (!authenticated || !privyUser) {
            setUser(null);
            setAuthLoading(false);
            return;
        }

        const uid = privyUser.id; // Privy DID — used as Firestore doc key
        const twitterAccount = privyUser.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth');
        const emailAccount = privyUser.linkedAccounts?.find((a: any) => a.type === 'email') as any;

        const shellUser: TalentProfile = {
            id: uid,
            email: emailAccount?.address || '',
            username: (twitterAccount as any)?.username || uid.slice(-8),
            displayName: (twitterAccount as any)?.name || (twitterAccount as any)?.username || 'Web3 User',
            photoUrl: (twitterAccount as any)?.profilePictureUrl || '',
            walletAddress: '',
            roles: [],
            skills: [],
            experience: [],
            availability: 'Full-time',
            bio: '',
            socials: {
                twitter: (twitterAccount as any)?.username ? `@${(twitterAccount as any).username}` : '',
            },
        } as any;

        (async () => {
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
                    // New user — seed initial doc + check referral
                    const refCode = typeof window !== 'undefined' ? localStorage.getItem('hub_ref') : null;
                    const seedData: any = {
                        ...shellUser,
                        createdAt: serverTimestamp(),
                    };
                    if (refCode && refCode !== uid) {
                        seedData.referredBy = refCode;
                        localStorage.removeItem('hub_ref');
                    }
                    await setDoc(doc(db, 'talents', uid), seedData, { merge: true });
                    setUser(shellUser);
                }
            } catch (e) {
                console.warn('Firestore unavailable, using Privy data only:', e);
                setUser(shellUser);
            }
            setAuthLoading(false);
        })();
    }, [ready, authenticated, privyUser?.id]);

    // Auto-sync embedded wallet address to profile once generated
    useEffect(() => {
        if (!user?.id || !wallets.length) return;
        const embedded = wallets.find((w: any) => w.walletClientType === 'privy');
        if (embedded && !user.walletAddress) {
            setDoc(doc(db, 'talents', user.id), { walletAddress: embedded.address }, { merge: true }).catch(() => {});
            setUser(prev => prev ? { ...prev, walletAddress: embedded.address } : prev);
        }
    }, [wallets, user?.id]);

    // Monitor unread messages
    useEffect(() => {
        if (!user?.id) { setUnreadMessagesCount(0); return; }
        const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.id));
        const unsubscribe = onSnapshot(q, (snap) => {
            let total = 0;
            snap.docs.forEach(d => { total += (d.data().unreadCount?.[user.id!] || 0); });
            setUnreadMessagesCount(total);
        }, () => { /* Firestore auth not available with Privy — suppress error */ });
        return () => unsubscribe();
    }, [user?.id]);

    // localStorage → state on first mount
    useEffect(() => {
        const savedJobs = localStorage.getItem('hub_bookmarked_jobs');
        const savedAirdrops = localStorage.getItem('hub_tracked_airdrops');
        const savedRes = localStorage.getItem('hub_saved_resumes');
        if (savedJobs) setBookmarkedJobs(JSON.parse(savedJobs));
        if (savedAirdrops) setTrackedAirdrops(JSON.parse(savedAirdrops));
        if (savedRes) setSavedResumes(JSON.parse(savedRes));
    }, []);

    useEffect(() => { localStorage.setItem('hub_bookmarked_jobs', JSON.stringify(bookmarkedJobs)); }, [bookmarkedJobs]);
    useEffect(() => { localStorage.setItem('hub_tracked_airdrops', JSON.stringify(trackedAirdrops)); }, [trackedAirdrops]);
    useEffect(() => { localStorage.setItem('hub_saved_resumes', JSON.stringify(savedResumes)); }, [savedResumes]);

    const logout = async () => {
        await privyLogout();
        setUser(null);
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
            console.error('Firestore sync error:', e);
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
            isLoggedIn: authenticated && !!user,
            authLoading: !ready || authLoading,
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
