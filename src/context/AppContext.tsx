'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TalentProfile, JobPosting, Airdrop } from '@/lib/types';
import { computeProfileScore } from '@/lib/promos';
import { auth, db } from '@/lib/firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
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
    login: () => void;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string) => Promise<void>;
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
    const [user, setUser] = useState<TalentProfile | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
    const [trackedAirdrops, setTrackedAirdrops] = useState<string[]>([]);
    const [savedResumes, setSavedResumes] = useState<string[]>([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Monitor Auth State
    useEffect(() => {
        if (!auth) {
            console.error("Firebase auth is not initialized. Check NEXT_PUBLIC_FIREBASE_* env vars on Vercel.");
            setAuthLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setIsLoggedIn(!!firebaseUser);

            if (firebaseUser) {
                const shellUser = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    username: firebaseUser.email?.split('@')[0] || 'user',
                    displayName: firebaseUser.displayName || 'User',
                    photoUrl: firebaseUser.photoURL || '',
                    walletAddress: '',
                    roles: [],
                    skills: [],
                    experience: [],
                    availability: 'Full-time',
                    bio: '',
                    socials: {},
                } as any;

                try {
                    // Try to fetch profile from Firestore 'talents' collection
                    const docRef = doc(db, 'talents', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUser({
                            ...data,
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                        } as TalentProfile);

                        // Sync bookmarks from Firestore (source of truth when logged in)
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
                        // New user — check if they came via a referral link
                        const refCode = typeof window !== 'undefined' ? localStorage.getItem('hub_ref') : null;
                        if (refCode && refCode !== firebaseUser.uid) {
                            shellUser.referredBy = refCode;
                            // Save basic doc so referredBy is persisted
                            await setDoc(doc(db, 'talents', firebaseUser.uid), { referredBy: refCode }, { merge: true });
                            localStorage.removeItem('hub_ref'); // consume it
                        }
                        setUser(shellUser);
                    }
                } catch (e) {
                    console.warn("Firestore offline or unavailable, using auth data only:", e);
                    setUser(shellUser);
                }
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Monitor Unread Messages
    useEffect(() => {
        if (!user?.id) {
            setUnreadMessagesCount(0);
            return;
        }

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', user.id)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            let total = 0;
            snap.docs.forEach(doc => {
                const data = doc.data();
                total += (data.unreadCount?.[user.id] || 0);
            });
            setUnreadMessagesCount(total);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const login = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (e: any) {
            console.error("Firebase login error:", e);
            alert(`Login error: ${e.message || 'Unknown error'}`);
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const registerWithEmail = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    // Log a 10% referral earning when a referred user makes a payment
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

    const logout = async () => {
        await signOut(auth);
        setIsLoggedIn(false);
        setUser(null);
    };

    // Load from localStorage on first mount (for logged-out users)
    useEffect(() => {
        const savedJobs = localStorage.getItem('hub_bookmarked_jobs');
        const savedAirdrops = localStorage.getItem('hub_tracked_airdrops');
        const savedRes = localStorage.getItem('hub_saved_resumes');
        if (savedJobs) setBookmarkedJobs(JSON.parse(savedJobs));
        if (savedAirdrops) setTrackedAirdrops(JSON.parse(savedAirdrops));
        if (savedRes) setSavedResumes(JSON.parse(savedRes));
    }, []);

    // Keep localStorage in sync
    useEffect(() => {
        localStorage.setItem('hub_bookmarked_jobs', JSON.stringify(bookmarkedJobs));
    }, [bookmarkedJobs]);

    useEffect(() => {
        localStorage.setItem('hub_tracked_airdrops', JSON.stringify(trackedAirdrops));
    }, [trackedAirdrops]);

    useEffect(() => {
        localStorage.setItem('hub_saved_resumes', JSON.stringify(savedResumes));
    }, [savedResumes]);

    const toggleBookmarkJob = (jobId: string) => {
        const newBookmarks = bookmarkedJobs.includes(jobId)
            ? bookmarkedJobs.filter(id => id !== jobId)
            : [...bookmarkedJobs, jobId];
        setBookmarkedJobs(newBookmarks);

        // Sync to Firestore if logged in
        const uid = auth.currentUser?.uid;
        if (uid) {
            setDoc(doc(db, 'talents', uid), { bookmarkedJobs: newBookmarks }, { merge: true }).catch(console.error);
        }
    };

    const toggleTrackAirdrop = (airdropId: string) => {
        const newTracked = trackedAirdrops.includes(airdropId)
            ? trackedAirdrops.filter(id => id !== airdropId)
            : [...trackedAirdrops, airdropId];
        setTrackedAirdrops(newTracked);

        // Sync to Firestore if logged in
        const uid = auth.currentUser?.uid;
        if (uid) {
            setDoc(doc(db, 'talents', uid), { trackedAirdrops: newTracked }, { merge: true }).catch(console.error);
        }
    };

    const toggleSaveResume = (talentId: string) => {
        const newSaved = savedResumes.includes(talentId)
            ? savedResumes.filter(id => id !== talentId)
            : [...savedResumes, talentId];
        setSavedResumes(newSaved);

        const uid = auth.currentUser?.uid;
        if (uid) {
            setDoc(doc(db, 'talents', uid), { savedResumes: newSaved }, { merge: true }).catch(console.error);
        }
    };

    const updateProfile = async (profile: Partial<TalentProfile>) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;

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
                photoUrl: updated.photoUrl || firebaseUser.photoURL || '',
                resumeUrl: updated.resumeUrl || '',
                updatedAt: serverTimestamp(),
                profileScore: computeProfileScore(updated),
                // If no reviews yet, reputationScore = profileScore so cards show it immediately
                ...(!updated.reviewCount ? { reputationScore: computeProfileScore(updated) } : {}),
                // NOTE: isAdmin should only be toggled manually in Firebase Console for security
            };
            // Include badge/boost fields if provided
            if (profile.hasBadge !== undefined) saveData.hasBadge = profile.hasBadge;
            if (profile.hasBadgePending !== undefined) saveData.hasBadgePending = profile.hasBadgePending;
            if (profile.badgeTxHash !== undefined) saveData.badgeTxHash = profile.badgeTxHash;
            if (profile.cvBoosted !== undefined) saveData.cvBoosted = profile.cvBoosted;
            if (profile.cvBoostExpiry !== undefined) saveData.cvBoostExpiry = profile.cvBoostExpiry;
            if (profile.openToWork !== undefined) saveData.openToWork = profile.openToWork;
            await setDoc(doc(db, 'talents', firebaseUser.uid), saveData, { merge: true });
        } catch (e) {
            console.error("Firestore sync error:", e);
        }
    };

    return (
        <AppContext.Provider value={{
            user,
            isLoggedIn,
            authLoading,
            bookmarkedJobs,
            trackedAirdrops,
            savedResumes,
            login,
            loginWithEmail,
            registerWithEmail,
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
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
