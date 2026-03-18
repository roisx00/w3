'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { KOLProfile, KOLNiche } from '@/lib/types';
import KOLCard from '@/components/KOLCard';
import { Megaphone, Search, Sparkles, Zap, Users, Filter } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import HireKOLModal from '@/components/HireKOLModal';

const PAGE_SIZE = 12;

const NICHES: KOLNiche[] = ['DeFi', 'NFTs', 'Gaming', 'Layer 2', 'AI x Crypto', 'Memes', 'Infrastructure', 'DAOs', 'Trading', 'Education'];

const NICHE_COLORS: Record<string, string> = {
    'DeFi': 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    'NFTs': 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20',
    'Gaming': 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20',
    'Layer 2': 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    'AI x Crypto': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
    'Memes': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
    'Infrastructure': 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
    'DAOs': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20',
    'Trading': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    'Education': 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
};

export default function KOLsPage() {
    const { isLoggedIn, user } = useAppContext();
    const [kols, setKols] = useState<KOLProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeNiche, setActiveNiche] = useState<KOLNiche | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    useEffect(() => {
        async function fetchKOLs() {
            try {
                const snap = await getDocs(collection(db, 'kols'));
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as KOLProfile[];
                // Sort: boosted > verified > reach
                data.sort((a, b) => {
                    if ((b.kolBoosted ? 1 : 0) !== (a.kolBoosted ? 1 : 0)) return (b.kolBoosted ? 1 : 0) - (a.kolBoosted ? 1 : 0);
                    if ((b.verified ? 1 : 0) !== (a.verified ? 1 : 0)) return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
                    return (b.totalReach || 0) - (a.totalReach || 0);
                });
                setKols(data);
            } catch (err) {
                console.error('Error fetching KOLs:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchKOLs();
    }, []);

    useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, activeNiche]);

    const filtered = kols.filter(k => {
        if (filterOpen && !k.openToCollabs) return false;
        if (activeNiche && !k.niches?.includes(activeNiche)) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            k.displayName?.toLowerCase().includes(q) ||
            k.username?.toLowerCase().includes(q) ||
            k.bio?.toLowerCase().includes(q) ||
            k.tagline?.toLowerCase().includes(q) ||
            k.niches?.some(n => n.toLowerCase().includes(q)) ||
            k.contentTypes?.some(c => c.toLowerCase().includes(q))
        );
    });

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    const [showHireModal, setShowHireModal] = useState(false);
    const hasKOLProfile = isLoggedIn && kols.some(k => k.id === user?.id);

    const totalReach = kols.reduce((sum, k) => sum + (k.totalReach || 0), 0);
    const formatBig = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : n.toString();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <HireKOLModal isOpen={showHireModal} onClose={() => setShowHireModal(false)} />

            {/* Hero */}
            <div className="relative mb-16 overflow-hidden rounded-3xl glass border border-white/5 p-10">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-pink-500/5 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-3 py-1.5 rounded-full">
                            <Megaphone className="w-3 h-3" />
                            KOL Hub
                        </span>
                        <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">· Web3 Influencer Network</span>
                    </div>
                    <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter leading-none mb-4">
                        The Premier<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-pink-400 to-accent-primary">KOL Directory</span>
                    </h1>
                    <p className="text-foreground/50 text-base max-w-lg font-medium mb-8">
                        Discover and connect with the top Key Opinion Leaders in Web3. Verified reach, real campaigns, on-chain identity.
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-8 mb-8">
                        <div>
                            <p className="text-2xl font-black text-accent-primary">{kols.length}</p>
                            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">KOLs Listed</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-black text-pink-400">{totalReach > 0 ? formatBig(totalReach) : '—'}</p>
                            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">Total Network</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-black text-emerald-400">{kols.filter(k => k.openToCollabs).length}</p>
                            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">Open to Collabs</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {!hasKOLProfile ? (
                            <Link
                                href="/kols/register"
                                className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent-primary/25"
                            >
                                <Sparkles className="w-4 h-4" />
                                Create KOL Profile
                            </Link>
                        ) : (
                            <Link
                                href={`/kols/${encodeURIComponent(user?.id || '')}`}
                                className="flex items-center gap-2 px-6 py-3 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-all"
                            >
                                View My KOL Profile
                            </Link>
                        )}
                        <button
                            onClick={() => setShowHireModal(true)}
                            className="flex items-center gap-2 px-6 py-3 glass border border-yellow-400/20 text-yellow-400 font-black text-xs uppercase tracking-widest rounded-xl hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all"
                        >
                            <Zap className="w-4 h-4" />
                            Hire a KOL
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-8">
                {/* Search + Open toggle */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input
                            type="text"
                            placeholder="Search KOLs by name, niche, content type..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 glass border border-white/10 rounded-xl focus:border-accent-primary/40 outline-none text-sm placeholder:text-foreground/30 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setFilterOpen(v => !v)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${filterOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'glass border-white/10 text-foreground/50 hover:border-white/20'}`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        Open to Collabs
                    </button>
                    <button
                        onClick={() => { setActiveNiche(null); setFilterOpen(false); setSearch(''); }}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl glass border border-white/10 text-foreground/40 font-black text-xs uppercase tracking-widest hover:border-white/20 transition-all"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Reset
                    </button>
                </div>

                {/* Niche pills */}
                <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                        <button
                            key={n}
                            onClick={() => setActiveNiche(activeNiche === n ? null : n)}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${activeNiche === n
                                ? (NICHE_COLORS[n] || 'bg-accent-primary/20 text-accent-primary border-accent-primary/40') + ' scale-105'
                                : 'bg-white/3 text-foreground/40 border-white/10 hover:border-white/20 hover:text-foreground/60'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="glass rounded-2xl h-56 animate-pulse" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <div className="text-center py-24">
                    <Megaphone className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                    <p className="text-foreground/20 font-bold text-lg uppercase tracking-widest">No KOLs found</p>
                    <p className="text-foreground/10 text-sm mt-2">Try adjusting your filters or be the first to join</p>
                    <Link href="/kols/register" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-colors">
                        <Sparkles className="w-3.5 h-3.5" /> Create KOL Profile
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visible.map(kol => <KOLCard key={kol.id} kol={kol} />)}
                    </div>

                    {hasMore ? (
                        <div className="text-center mt-10">
                            <button
                                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                                className="px-8 py-3 glass border border-white/10 text-sm font-black uppercase tracking-widest hover:border-accent-primary/30 hover:text-accent-primary transition-all rounded-xl"
                            >
                                Load More ({filtered.length - visibleCount} remaining)
                            </button>
                        </div>
                    ) : filtered.length > PAGE_SIZE && (
                        <p className="text-center mt-8 text-foreground/20 text-xs font-bold uppercase tracking-widest">
                            Showing all {filtered.length} KOLs
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
