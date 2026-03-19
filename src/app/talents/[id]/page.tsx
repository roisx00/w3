'use client';

import { use, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, increment } from 'firebase/firestore';
import { TalentProfile } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import ReviewSection from '@/components/ReviewSection';
import GoldBadge from '@/components/GoldBadge';
import FounderBadge from '@/components/FounderBadge';
import TalentProfileView from '@/components/TalentProfileView';
import Link from 'next/link';

export default function TalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, savedResumes, toggleSaveResume } = useAppContext();
    const [talent, setTalent] = useState<TalentProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAndIncrement() {
            try {
                // Try direct DID lookup first
                let docRef = doc(db, 'talents', id);
                let docSnap = await getDoc(docRef);
                // Fallback: lookup by username (for short URLs like /talents/internxbt)
                if (!docSnap.exists()) {
                    const q = query(collection(db, 'talents'), where('username', '==', id));
                    const snap = await getDocs(q);
                    if (!snap.empty) docSnap = snap.docs[0] as any;
                }
                if (docSnap.exists()) {
                    setTalent({ id: docSnap.id, ...docSnap.data() } as TalentProfile);
                    updateDoc(doc(db, 'talents', docSnap.id), { views: increment(1) }).catch(() => {});
                }
            } catch (err) {
                console.error('Error fetching talent:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAndIncrement();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Loading Resume...</p>
            </div>
        );
    }

    if (!talent) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
                <Link href="/talents" className="text-accent-primary hover:underline">Return to Hub</Link>
            </div>
        );
    }

    return (
        <TalentProfileView 
            talent={talent} 
            id={id} 
            currentUser={user} 
            savedResumes={savedResumes} 
            toggleSaveResume={toggleSaveResume} 
        />
    );
}
