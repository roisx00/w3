'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

interface Stat {
    label: string;
    value: number;
    suffix?: string;
}

function useCountUp(target: number, duration = 1200) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (target === 0) return;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease out
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(target);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);
    return count;
}

function StatItem({ label, value }: { label: string; value: number }) {
    const count = useCountUp(value);
    return (
        <div className="text-center px-8 py-6 flex-1">
            <div className="text-4xl md:text-5xl font-black tracking-tight mb-1">
                {count}<span className="text-accent-primary">+</span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/40">{label}</div>
        </div>
    );
}

export default function StatsBar() {
    const [stats, setStats] = useState<Stat[]>([
        { label: 'Web3 Resumes', value: 0 },
        { label: 'KOL Profiles', value: 0 },
        { label: 'Projects Hiring', value: 0 },
        { label: 'Airdrops Listed', value: 0 },
    ]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function fetchCounts() {
            try {
                const [talentsSnap, kolsSnap, jobsSnap, airdropsSnap] = await Promise.all([
                    getCountFromServer(collection(db, 'talents')),
                    getCountFromServer(collection(db, 'kols')),
                    getCountFromServer(query(collection(db, 'jobs'), where('paymentStatus', '!=', 'pending'))),
                    getCountFromServer(query(collection(db, 'airdrops'), where('paymentStatus', '!=', 'pending'))),
                ]);
                setStats([
                    { label: 'Web3 Resumes', value: talentsSnap.data().count },
                    { label: 'KOL Profiles', value: kolsSnap.data().count },
                    { label: 'Projects Hiring', value: jobsSnap.data().count },
                    { label: 'Airdrops Listed', value: airdropsSnap.data().count },
                ]);
            } catch {
                // Firestore unavailable — leave at 0
            } finally {
                setLoaded(true);
            }
        }
        fetchCounts();
    }, []);

    if (!loaded) return null;

    return (
        <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="glass border border-white/10 rounded-2xl flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/5 overflow-hidden">
                {stats.map(stat => (
                    <StatItem key={stat.label} label={stat.label} value={stat.value} />
                ))}
            </div>
        </div>
    );
}
