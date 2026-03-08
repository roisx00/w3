'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TalentProfile, JobPosting, Airdrop } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';

interface AppState {
    user: TalentProfile | null;
    isLoggedIn: boolean;
    authLoading: boolean;
    bookmarkedJobs: string[];
    trackedAirdrops: string[];
    login: () => void;
    logout: () => void;
    toggleBookmarkJob: (jobId: string) => void;
    toggleTrackAirdrop: (airdropId: string) => void;
    updateProfile: (profile: Partial<TalentProfile>) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<TalentProfile | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
    const [trackedAirdrops, setTrackedAirdrops] = useState<string[]>([]);

    // Monitor Auth State
    useEffect(() => {
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
                    } else {
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

    const login = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (e: any) {
            console.error("Firebase login error:", e);
            alert(`Login error: ${e.message || 'Unknown error'}`);
        }
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
        if (savedJobs) setBookmarkedJobs(JSON.parse(savedJobs));
        if (savedAirdrops) setTrackedAirdrops(JSON.parse(savedAirdrops));
    }, []);

    // Keep localStorage in sync
    useEffect(() => {
        localStorage.setItem('hub_bookmarked_jobs', JSON.stringify(bookmarkedJobs));
    }, [bookmarkedJobs]);

    useEffect(() => {
        localStorage.setItem('hub_tracked_airdrops', JSON.stringify(trackedAirdrops));
    }, [trackedAirdrops]);

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
                // NOTE: isAdmin should only be toggled manually in Firebase Console for security
            };
            // Include badge/boost fields if provided
            if (profile.hasBadge !== undefined) saveData.hasBadge = profile.hasBadge;
            if (profile.hasBadgePending !== undefined) saveData.hasBadgePending = profile.hasBadgePending;
            if (profile.badgeTxHash !== undefined) saveData.badgeTxHash = profile.badgeTxHash;
            if (profile.cvBoosted !== undefined) saveData.cvBoosted = profile.cvBoosted;
            if (profile.cvBoostExpiry !== undefined) saveData.cvBoostExpiry = profile.cvBoostExpiry;
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
            login,
            logout,
            toggleBookmarkJob,
            toggleTrackAirdrop,
            updateProfile,
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
