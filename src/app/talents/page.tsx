'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { TalentProfile } from '@/lib/types';
import TalentCard from '@/components/TalentCard';
import { Users, UserPlus, Search, Radio } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 12;

export default function TalentsPage() {
    const [talents, setTalents] = useState<TalentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterOpenToWork, setFilterOpenToWork] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    useEffect(() => {
        async function fetchTalents() {
            try {
                const talentsRef = collection(db, 'talents');
                const q = query(talentsRef, orderBy('score', 'desc'));
                const querySnapshot = await getDocs(q);

                const fetchedTalents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as TalentProfile[];

                // Sort: cvBoosted talents first
                fetchedTalents.sort((a, b) => (b.cvBoosted ? 1 : 0) - (a.cvBoosted ? 1 : 0));
                setTalents(fetchedTalents);
            } catch (err) {
                console.error('Error fetching talents:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchTalents();
    }, []);

    // Reset visibleCount when search changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search]);

    const filtered = talents.filter(talent => {
        if (filterOpenToWork && !talent.openToWork) return false;
        return !search ||
            talent.displayName?.toLowerCase().includes(search.toLowerCase()) ||
            talent.username?.toLowerCase().includes(search.toLowerCase()) ||
            talent.bio?.toLowerCase().includes(search.toLowerCase()) ||
            talent.roles?.some(r => r.toLowerCase().includes(search.toLowerCase())) ||
            talent.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()));
    });

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <header className="mb-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 glass-pill mb-4 border-white/5">
                            <Users className="w-3 h-3 text-accent-primary" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-accent-primary">TALENT NETWORK</span>
                        </div>
                        <h1 className="font-display font-black text-6xl mb-4 tracking-tight uppercase text-foreground leading-none">Talent Hub</h1>
                        <p className="text-foreground/40 font-medium text-lg">Elite Web3 professionals ready for your next project.</p>
                    </div>
                    <Link
                        href="/onboarding"
                        className="px-8 py-4 bg-accent-primary text-white font-black rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-tighter flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    >
                        CREATE PROFILE
                        <UserPlus className="w-4 h-4" />
                    </Link>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 p-2 glass rounded-2xl border-white/5">
                    <div className="flex-grow relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, role, or skills..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-accent-primary/30 transition-colors font-medium"
                        />
                    </div>
                    <button
                        onClick={() => setFilterOpenToWork(f => !f)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 ${filterOpenToWork
                                ? 'bg-accent-success/15 border border-accent-success/40 text-accent-success'
                                : 'bg-white/5 border border-white/5 text-foreground/40 hover:border-white/10'
                            }`}
                    >
                        <Radio className="w-3.5 h-3.5" />
                        Open to Work
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Finding Professionals...</p>
                    </div>
                ) : visible.length > 0 ? (
                    visible.map((talent) => (
                        <TalentCard key={talent.id} talent={talent} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 glass rounded-3xl">
                        <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">
                            {talents.length === 0 ? 'No talent found in the network.' : `No results for "${search}"`}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer / Load More */}
            <div className="mt-16 text-center">
                {!loading && filtered.length > 0 && (
                    hasMore ? (
                        <button
                            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                            className="px-12 py-4 glass border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-foreground/60"
                        >
                            Load More ({filtered.length - visibleCount} remaining)
                        </button>
                    ) : (
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground/20">
                            Showing all {filtered.length} results
                        </p>
                    )
                )}
            </div>
        </div>
    );
}
