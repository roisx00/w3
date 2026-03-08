'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Airdrop } from '@/lib/types';
import AirdropCard from '@/components/AirdropCard';
import { Sparkles, Search, Plus } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function AirdropsPage() {
    const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    useEffect(() => {
        async function fetchAirdrops() {
            try {
                const airdropsRef = collection(db, 'airdrops');
                const q = query(airdropsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const fetchedAirdrops = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Airdrop[];

                // Sort: featured first
                fetchedAirdrops.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
                setAirdrops(fetchedAirdrops);
            } catch (err) {
                console.error('Error fetching airdrops:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchAirdrops();
    }, []);

    // Reset visibleCount when search changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search]);

    const filtered = airdrops.filter(airdrop =>
        // hide pending/rejected listings (backwards compat: no paymentStatus = old listing = show)
        airdrop.paymentStatus !== 'pending' && airdrop.paymentStatus !== 'rejected' &&
        (!search ||
        airdrop.projectName.toLowerCase().includes(search.toLowerCase()) ||
        airdrop.blockchain.toLowerCase().includes(search.toLowerCase()) ||
        airdrop.description.toLowerCase().includes(search.toLowerCase()))
    );

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <header className="mb-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 glass-pill mb-4 border-white/5">
                            <Sparkles className="w-3 h-3 text-accent-secondary" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-accent-secondary">NEW ALPHA DETECTED</span>
                        </div>
                        <h1 className="font-display font-black text-6xl mb-4 tracking-tight uppercase text-foreground leading-none">Airdrop Hub</h1>
                        <p className="text-foreground/40 font-medium text-lg">Early protocol opportunities and testnet campaigns.</p>
                    </div>
                    <Link
                        href="/airdrops/submit"
                        className="px-8 py-4 bg-accent-secondary text-white font-black rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-tighter flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    >
                        SUBMIT ALPHA
                        <Plus className="w-4 h-4" />
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
                            placeholder="Search by protocol or blockchain..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-accent-secondary/30 transition-colors font-medium"
                        />
                    </div>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-accent-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Scanning for Alpha...</p>
                    </div>
                ) : visible.length > 0 ? (
                    visible.map((airdrop) => (
                        <AirdropCard key={airdrop.id} airdrop={airdrop} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 glass rounded-3xl">
                        <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">
                            {airdrops.length === 0 ? 'No alpha signals found in the database.' : `No results for "${search}"`}
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
