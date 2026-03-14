'use client';

import { use, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { TalentProfile } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import TalentProfileView from '@/components/TalentProfileView';
import Link from 'next/link';

export default function UsernameProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const { user, savedResumes, toggleSaveResume } = useAppContext();
    const [talent, setTalent] = useState<TalentProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchByUsername() {
            if (!username) return;
            try {
                const q = query(
                    collection(db, 'talents'),
                    where('username', '==', username.toLowerCase()),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    const talentData = { id: docSnap.id, ...docSnap.data() } as TalentProfile;
                    setTalent(talentData);

                    // Increment views
                    updateDoc(doc(db, 'talents', docSnap.id), { views: increment(1) }).catch(() => {});
                }
            } catch (err) {
                console.error('Error fetching talent by username:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchByUsername();
    }, [username]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
            </div>
        );
    }

    if (!talent) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Profile @{username} not found</h2>
                <Link href="/talents" className="text-accent-primary hover:underline">Return to Hub</Link>
            </div>
        );
    }

    return (
        <TalentProfileView 
            talent={talent} 
            id={talent.id!} 
            currentUser={user} 
            savedResumes={savedResumes} 
            toggleSaveResume={toggleSaveResume} 
        />
    );
}
