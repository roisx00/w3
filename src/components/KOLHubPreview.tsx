'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Megaphone, ArrowUpRight, BadgeCheck, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function KOLHubPreview() {
    const [stats, setStats] = useState({ total: 0, verified: 0, network: 0, openToCollabs: 0 });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        getDocs(collection(db, 'kols')).then(snap => {
            const kols = snap.docs.map(d => d.data());
            const network = kols.reduce((sum, k) => sum + (k.totalReach || 0), 0);
            setStats({
                total: kols.length,
                verified: kols.filter(k => k.verified).length,
                network,
                openToCollabs: kols.filter(k => k.openToCollabs).length,
            });
            setLoaded(true);
        }).catch(() => setLoaded(true));
    }, []);

    const fmt = (n: number) =>
        n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
        n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : n.toString();

    const statItems = [
        { value: loaded ? fmt(stats.total) : '—', label: 'KOLs Listed', color: 'text-red-400' },
        { value: loaded ? fmt(stats.network) : '—', label: 'Total Network', color: 'text-pink-400' },
        { value: loaded ? String(stats.verified) : '—', label: 'Verified', color: 'text-emerald-400' },
        { value: loaded ? String(stats.openToCollabs) : '—', label: 'Open to Collabs', color: 'text-amber-400' },
    ];

    return (
        <Link href="/kols" className="group block glass p-8 md:p-10 hover:border-red-500/40 transition-all relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-red-500/10 transition-colors" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/5 rounded-full blur-[60px] -ml-24 -mb-24" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="shrink-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/50 mb-2">01</div>
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Megaphone className="w-8 h-8 text-red-400" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-black text-3xl uppercase tracking-tight">KOL Hub</h3>
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            Live
                        </span>
                        <ArrowUpRight className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-foreground/50 text-base mb-6 max-w-xl">
                        The premier Web3 influencer directory. Verified KOLs, real campaign history, on-chain identity. Projects hire directly with no middlemen and no guesswork.
                    </p>

                    {/* Live stats row */}
                    <div className="flex flex-wrap gap-6 mb-5">
                        {statItems.map(s => (
                            <div key={s.label}>
                                <p className={`text-xl font-black ${s.color} tabular-nums`}>{s.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { icon: BadgeCheck, label: 'Verified Identity', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                            { icon: Users, label: 'Network Stats', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
                            { icon: Zap, label: 'Hire a KOL', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                        ].map(({ icon: Icon, label, color }) => (
                            <span key={label} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${color}`}>
                                <Icon className="w-3 h-3" />{label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
}
