'use client';

import Link from 'next/link';
import { KOLProfile } from '@/lib/types';
import { computeW3Score, getW3Tier } from '@/lib/w3score';
import { Zap, Users, TrendingUp, MessageCircle } from 'lucide-react';

const KOL_BADGE_PATH = "M 50 4 C 61.5,4 52.6,13 61.1,15.8 C 69.7,18.5 67.8,6 77.1,12.8 C 86.4,19.5 73.8,21.6 79.1,28.8 C 84.4,36.1 90.2,24.8 93.7,35.8 C 97.3,46.7 86,41 86,50 C 86,59 97.3,53.3 93.7,64.2 C 90.2,75.2 84.4,63.9 79.1,71.2 C 73.8,78.5 86.4,80.5 77.1,87.2 C 67.8,94 70,81.5 61.1,84.2 C 52.6,87 61.5,96 50,96 C 38.5,96 47.4,87 38.9,84.2 C 30.3,81.5 32.2,94 22.9,87.2 C 13.7,80.5 26.2,78.5 20.9,71.2 C 15.6,63.9 9.8,75.2 6.3,64.2 C 2.7,53.3 14,59 14,50 C 14,41 2.7,46.7 6.3,35.8 C 9.8,24.8 15.6,36.1 20.9,28.8 C 26.2,21.6 13.7,19.5 22.9,12.8 C 32.2,6 30.3,18.5 38.9,15.8 C 47.4,13 38.5,4 50,4 Z";

function formatReach(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
}

const NICHE_COLORS: Record<string, string> = {
    'DeFi': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'NFTs': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'Gaming': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Layer 2': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'AI x Crypto': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Memes': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Infrastructure': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'DAOs': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Trading': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Education': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function KOLCard({ kol }: { kol: KOLProfile }) {
    const totalReach = kol.totalReach || Object.values(kol.platforms || {}).reduce((sum: number, p: any) => {
        return sum + (p?.followers || p?.subscribers || p?.members || 0);
    }, 0);

    const w3Score = computeW3Score(kol);
    const tier = getW3Tier(w3Score);

    const twitterHandle = kol.platforms?.twitter?.handle;

    return (
        <Link href={`/kols/${encodeURIComponent(kol.id)}`} className="group block">
            <div className="glass p-5 rounded-2xl border border-white/5 hover:border-accent-primary/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)] transition-all duration-300 h-full flex flex-col gap-4">

                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-accent-primary/10 border border-accent-primary/20">
                            {kol.photoUrl
                                ? <img src={kol.photoUrl} alt={kol.displayName} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-accent-primary font-black text-lg">{kol.displayName?.charAt(0)}</div>
                            }
                        </div>
                        {kol.verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 drop-shadow-[0_0_5px_rgba(220,38,38,0.7)]">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <path d={KOL_BADGE_PATH} fill="#dc2626" />
                                    <path d="M 34 50 L 44 62 L 66 37" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm truncate max-w-[120px]">{kol.displayName}</span>
                            {kol.id?.startsWith('demo_') && (
                                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/15 text-foreground/30 bg-white/5">
                                    Demo
                                </span>
                            )}
                            {kol.kolBoosted && (
                                <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">
                                    <Zap className="w-2 h-2" /> Featured
                                </span>
                            )}
                        </div>
                        {kol.tagline && (
                            <p className="text-[10px] text-foreground/40 font-bold mt-0.5 truncate">{kol.tagline}</p>
                        )}
                        {twitterHandle && (
                            <p className="text-[10px] text-accent-primary/60 font-mono mt-0.5">@{twitterHandle.replace('@', '')}</p>
                        )}
                    </div>
                </div>

                {/* Niches */}
                {kol.niches?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {kol.niches.slice(0, 3).map(n => (
                            <span key={n} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${NICHE_COLORS[n] || 'bg-white/5 text-foreground/40 border-white/10'}`}>
                                {n}
                            </span>
                        ))}
                        {kol.niches.length > 3 && (
                            <span className="text-[9px] font-bold text-foreground/30">+{kol.niches.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Bio */}
                <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2 flex-1">
                    {kol.bio || 'No bio yet.'}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="text-center p-2 bg-white/3 rounded-xl">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <Users className="w-2.5 h-2.5 text-accent-primary/60" />
                        </div>
                        <p className="text-sm font-black text-accent-primary">{totalReach > 0 ? formatReach(totalReach) : '—'}</p>
                        <p className="text-[8px] text-foreground/30 uppercase tracking-widest font-bold">Followers</p>
                    </div>
                    <div className="text-center p-2 bg-white/3 rounded-xl">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <TrendingUp className="w-2.5 h-2.5 text-emerald-400/60" />
                        </div>
                        <p className="text-sm font-black text-emerald-400">{kol.campaigns?.length || 0}</p>
                        <p className="text-[8px] text-foreground/30 uppercase tracking-widest font-bold">Campaigns</p>
                    </div>
                    <div className="text-center p-2 bg-white/3 rounded-xl">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <MessageCircle className="w-2.5 h-2.5 text-blue-400/60" />
                        </div>
                        <p className="text-sm font-black text-blue-400">{kol.contentTypes?.length || 0}</p>
                        <p className="text-[8px] text-foreground/30 uppercase tracking-widest font-bold">Formats</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                        {kol.openToCollabs ? (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Open to Collabs
                            </span>
                        ) : (
                            <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Busy</span>
                        )}
                    </div>

                    {/* W3 Score — redesigned */}
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${tier.bg} ${tier.border}`}
                        style={tier.glow ? { boxShadow: tier.glow } : {}}>
                        <div className="text-right leading-none">
                            <p className={`text-[7px] font-black uppercase tracking-widest opacity-60 mb-0.5 ${tier.color}`}>W3 Score</p>
                            <div className="flex items-baseline gap-0.5">
                                <span className={`text-base font-black leading-none ${tier.color}`}>{w3Score}</span>
                                <span className="text-[8px] text-foreground/25 font-bold">/1k</span>
                            </div>
                            <p className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${tier.color} opacity-70`}>{tier.label}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="w-10 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${tier.color}`}
                                    style={{ width: `${w3Score / 10}%`, background: 'currentColor' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
