'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { KOLProfile } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { usePrivy } from '@privy-io/react-auth';
import {
    ExternalLink, TrendingUp, Megaphone, Zap,
    Globe, Send, Copy, Check, Loader2, Pencil, MessageSquare, Info, BadgeCheck
} from 'lucide-react';

const KOL_BADGE_PATH = "M 50 4 C 61.5,4 52.6,13 61.1,15.8 C 69.7,18.5 67.8,6 77.1,12.8 C 86.4,19.5 73.8,21.6 79.1,28.8 C 84.4,36.1 90.2,24.8 93.7,35.8 C 97.3,46.7 86,41 86,50 C 86,59 97.3,53.3 93.7,64.2 C 90.2,75.2 84.4,63.9 79.1,71.2 C 73.8,78.5 86.4,80.5 77.1,87.2 C 67.8,94 70,81.5 61.1,84.2 C 52.6,87 61.5,96 50,96 C 38.5,96 47.4,87 38.9,84.2 C 30.3,81.5 32.2,94 22.9,87.2 C 13.7,80.5 26.2,78.5 20.9,71.2 C 15.6,63.9 9.8,75.2 6.3,64.2 C 2.7,53.3 14,59 14,50 C 14,41 2.7,46.7 6.3,35.8 C 9.8,24.8 15.6,36.1 20.9,28.8 C 26.2,21.6 13.7,19.5 22.9,12.8 C 32.2,6 30.3,18.5 38.9,15.8 C 47.4,13 38.5,4 50,4 Z";
import Link from 'next/link';
import { computeW3Score, getW3Tier, getW3ScoreBreakdown } from '@/lib/w3score';
import { PRICES } from '@/lib/payments';
import PaymentModal from '@/components/PaymentModal';
import BadgeSuccessModal from '@/components/BadgeSuccessModal';
import KOLFeedbackSection from '@/components/KOLFeedbackSection';
import TweetEmbed from '@/components/TweetEmbed';

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

function formatReach(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="glass p-4 rounded-2xl text-center">
            <p className="text-2xl font-black text-accent-primary">{value}</p>
            {sub && <p className="text-[9px] text-foreground/30 font-bold">{sub}</p>}
            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
}

export default function KOLProfilePage() {
    const params = useParams<{ id: string }>();
    const id = decodeURIComponent(params.id);
    const { user, logReferralEarning } = useAppContext();
    const { getAccessToken } = usePrivy();
    const [kol, setKol] = useState<KOLProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [contactCopied, setContactCopied] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [badgeLoading, setBadgeLoading] = useState(false);
    const [showKolSuccess, setShowKolSuccess] = useState(false);

    const isOwn = user?.id === id;

    useEffect(() => {
        if (!id) return;
        getDoc(doc(db, 'kols', id)).then(snap => {
            if (snap.exists()) setKol({ id: snap.id, ...snap.data() } as KOLProfile);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
    );

    if (!kol) return (
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
            <Megaphone className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <h1 className="text-xl font-black uppercase text-foreground/30">KOL Profile Not Found</h1>
            <Link href="/kols" className="inline-block mt-6 text-accent-primary font-bold hover:underline">← Back to KOL Hub</Link>
        </div>
    );

    const totalReach = kol.totalReach || Object.values(kol.platforms || {}).reduce((sum: number, p: any) => {
        return sum + (p?.followers || p?.subscribers || p?.members || 0);
    }, 0);

    const w3Score = computeW3Score(kol);
    const tier = getW3Tier(w3Score);
    const breakdown = getW3ScoreBreakdown(kol);

    const twitterHandle = kol.platforms?.twitter?.handle?.replace('@', '');


    const copyContact = () => {
        navigator.clipboard.writeText(`https://w3hub.space/kols/${encodeURIComponent(id)}`);
        setContactCopied(true);
        setTimeout(() => setContactCopied(false), 2000);
    };

    const copyWallet = () => {
        if (!kol.walletAddress) return;
        navigator.clipboard.writeText(kol.walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleBadgePurchase = async (txHash: string) => {
        setBadgeLoading(true);
        try {
            const token = await getAccessToken();
            await fetch('/api/kols/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ userId: id, data: { hasBadge: true, badgeTxHash: txHash } }),
            });
            // Write payment record
            await addDoc(collection(db, 'payments'), {
                userId: id,
                userEmail: user?.email || '',
                userDisplayName: user?.displayName || '',
                type: 'kol_badge',
                amount: PRICES.KOL_BADGE,
                txHash,
                status: 'verified',
                createdAt: serverTimestamp(),
            });
            // Trigger referral earning if the buyer was referred
            if (user) await logReferralEarning('kol_badge', PRICES.KOL_BADGE, txHash, user as any);
            setKol(prev => prev ? { ...prev, hasBadge: true, badgeTxHash: txHash } : prev);
            setShowBadgeModal(false);
            setShowKolSuccess(true);
        } finally {
            setBadgeLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">

            {/* Back */}
            <Link href="/kols" className="inline-flex items-center gap-2 text-foreground/40 hover:text-accent-primary text-xs font-bold uppercase tracking-widest transition-colors">
                ← KOL Hub
            </Link>

            {/* Hero Card */}
            <div className="relative glass overflow-hidden rounded-3xl border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/8 via-transparent to-pink-500/5 pointer-events-none" />
                <div className="relative p-8 sm:p-10">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-accent-primary/30 shadow-[0_0_40px_rgba(124,58,237,0.2)]">
                                {kol.photoUrl
                                    ? <img src={kol.photoUrl} alt={kol.displayName} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full bg-gradient-to-br from-accent-primary/30 to-pink-500/20 flex items-center justify-center text-4xl font-black text-accent-primary">
                                        {kol.displayName?.charAt(0)}
                                    </div>
                                }
                            </div>
                            {kol.verified && (
                                <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm pl-1 pr-2 py-0.5 rounded-full border border-red-500/20">
                                    <div className="w-5 h-5 drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            <defs>
                                                <linearGradient id="kolProfBadgeGrad" x1="30%" y1="20%" x2="70%" y2="80%">
                                                    <stop offset="0%" stopColor="#ff2222" />
                                                    <stop offset="100%" stopColor="#8b0020" />
                                                </linearGradient>
                                            </defs>
                                            <path d={KOL_BADGE_PATH} fill="url(#kolProfBadgeGrad)" />
                                            <path d="M 34 50 L 44 62 L 66 37" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Verified</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">{kol.displayName}</h1>
                                {kol.kolBoosted && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                                        <Zap className="w-2.5 h-2.5" /> Featured
                                    </span>
                                )}
                                {kol.openToCollabs && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Open to Collabs
                                    </span>
                                )}
                            </div>

                            {kol.tagline && (
                                <p className="text-sm font-bold text-foreground/50 mb-3">{kol.tagline}</p>
                            )}

                            {/* Niches */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {kol.niches?.map(n => (
                                    <span key={n} className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${NICHE_COLORS[n] || 'bg-white/5 text-foreground/40 border-white/10'}`}>
                                        {n}
                                    </span>
                                ))}
                            </div>

                            <p className="text-sm text-foreground/60 leading-relaxed max-w-2xl mb-6">{kol.bio}</p>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-3">
                                {twitterHandle && (
                                    <a
                                        href={`https://x.com/${twitterHandle}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 glass border border-white/10 text-foreground/60 font-black text-xs uppercase tracking-widest rounded-xl hover:border-accent-primary/30 hover:text-accent-primary transition-all"
                                    >
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                                        </svg>
                                        X
                                    </a>
                                )}
                                <button
                                    onClick={copyContact}
                                    className="flex items-center gap-2 px-4 py-2 glass border border-white/10 text-foreground/60 font-black text-xs uppercase tracking-widest rounded-xl hover:border-white/20 hover:text-foreground transition-all"
                                >
                                    {contactCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    {contactCopied ? 'Copied!' : 'Copy Profile Link'}
                                </button>
                                {isOwn && (
                                    <Link
                                        href="/kols/register"
                                        className="flex items-center gap-2 px-5 py-2.5 glass border border-accent-primary/20 text-accent-primary font-black text-xs uppercase tracking-widest rounded-xl hover:border-accent-primary/40 transition-all"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit Profile
                                    </Link>
                                )}
                                {isOwn && !kol.hasBadge && (
                                    <button
                                        onClick={() => setShowBadgeModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-500/20 transition-all"
                                    >
                                        <BadgeCheck className="w-3.5 h-3.5" /> Get KOL Badge · $5
                                    </button>
                                )}
                                {isOwn && kol.hasBadge && (
                                    <span className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-xs uppercase tracking-widest rounded-xl">
                                        <BadgeCheck className="w-3.5 h-3.5" /> KOL Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right stack: W3 Score + Budget */}
                        <div className="hidden sm:flex flex-col gap-3 flex-shrink-0">
                            {/* W3 Score ring */}
                            <div className={`glass border ${tier.border} rounded-2xl p-5 text-center min-w-[150px] group/score relative`}
                                style={{ boxShadow: tier.glow }}>
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">W3 Score</p>
                                    <Info className="w-2.5 h-2.5 text-foreground/20 group-hover/score:text-foreground/50 transition-colors" />
                                </div>
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                        <circle
                                            cx="32" cy="32" r="26"
                                            fill="none"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 26}`}
                                            strokeDashoffset={`${2 * Math.PI * 26 * (1 - w3Score / 1000)}`}
                                            className={tier.color.replace('text-', 'stroke-')}
                                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-lg font-black ${tier.color}`}>{w3Score}</span>
                                    </div>
                                </div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</p>
                                <p className="text-[8px] text-foreground/20 font-bold mt-0.5">out of 1000</p>

                                {/* Breakdown tooltip on hover */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 glass border border-white/10 rounded-2xl p-3 opacity-0 group-hover/score:opacity-100 pointer-events-none transition-opacity duration-200 z-50 text-left">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-foreground/30 mb-2">Score Breakdown</p>
                                    <div className="space-y-1.5">
                                        {breakdown.map(item => (
                                            <div key={item.label} className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-0.5">
                                                        <span className="text-[9px] font-bold text-foreground/50">{item.label}</span>
                                                        <span className={`text-[9px] font-black ${tier.color}`}>{item.score}<span className="text-foreground/20">/{item.max}</span></span>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${tier.color.replace('text-', 'bg-')}`}
                                                            style={{ width: `${(item.score / item.max) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {kol.minBudget && kol.minBudget > 0 ? (
                                <div className="glass border border-accent-primary/20 rounded-2xl p-5 text-center min-w-[130px]">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-1">Min Budget</p>
                                    <p className="text-3xl font-black text-accent-primary">${kol.minBudget}</p>
                                    <p className="text-[9px] text-foreground/30 font-bold mt-0.5">per campaign</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <StatBox label="Total Audience" value={totalReach > 0 ? formatReach(totalReach) : '—'} sub="across all platforms" />
                <StatBox label="Collaborations" value={String(kol.campaigns?.length || 0)} />
                <StatBox label="Content Formats" value={String(kol.contentTypes?.length || 0)} />
                <StatBox label="Languages" value={String(kol.languages?.length || 0)} />
                <div className={`glass p-4 rounded-2xl text-center border ${tier.border}`} style={{ boxShadow: tier.glow }}>
                    <p className={`text-2xl font-black ${tier.color}`}>{w3Score}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${tier.color}`}>{tier.label}</p>
                    <p className="text-[8px] text-foreground/20 font-bold uppercase tracking-widest">/ 1000 · W3 Score</p>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column — platforms + content types + languages */}
                <div className="space-y-6">

                    {/* Platforms */}
                    {Object.keys(kol.platforms || {}).length > 0 && (
                        <section className="glass p-6 rounded-2xl">
                            <h2 className="font-display font-black text-xs uppercase tracking-widest text-foreground/30 mb-4">Platforms</h2>
                            <div className="space-y-3">
                                {kol.platforms?.twitter && (
                                    <a href={`https://x.com/${kol.platforms.twitter.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-white/3 hover:bg-white/5 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-2.5">
                                            <svg className="w-4 h-4 text-foreground/50 group-hover:text-accent-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                                            </svg>
                                            <div>
                                                <p className="text-xs font-bold">X / Twitter</p>
                                                <p className="text-[10px] text-foreground/40">@{kol.platforms.twitter.handle.replace('@', '')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-accent-primary">{formatReach(kol.platforms.twitter.followers)}</p>
                                            {kol.platforms.twitter.engagementRate && (
                                                <p className="text-[9px] text-emerald-400 font-bold">{kol.platforms.twitter.engagementRate}% eng.</p>
                                            )}
                                        </div>
                                    </a>
                                )}
                                {kol.platforms?.youtube && (
                                    <a href={`https://youtube.com/@${kol.platforms.youtube.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-white/3 hover:bg-white/5 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-2.5">
                                            <svg className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                            <div>
                                                <p className="text-xs font-bold">YouTube</p>
                                                <p className="text-[10px] text-foreground/40">@{kol.platforms.youtube.handle.replace('@', '')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-red-400">{formatReach(kol.platforms.youtube.subscribers)}</p>
                                    </a>
                                )}
                                {kol.platforms?.telegram && (
                                    <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                                        <div className="flex items-center gap-2.5">
                                            <Send className="w-4 h-4 text-blue-400" />
                                            <div>
                                                <p className="text-xs font-bold">Telegram</p>
                                                <p className="text-[10px] text-foreground/40">@{kol.platforms.telegram.handle.replace('@', '')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-blue-400">{formatReach(kol.platforms.telegram.members)}</p>
                                    </div>
                                )}
                                {kol.platforms?.tiktok && (
                                    <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                                        <div className="flex items-center gap-2.5">
                                            <Globe className="w-4 h-4 text-pink-400" />
                                            <div>
                                                <p className="text-xs font-bold">TikTok</p>
                                                <p className="text-[10px] text-foreground/40">@{kol.platforms.tiktok.handle.replace('@', '')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-pink-400">{formatReach(kol.platforms.tiktok.followers)}</p>
                                    </div>
                                )}
                                {kol.platforms?.discord && (
                                    <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                                        <div className="flex items-center gap-2.5">
                                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                                            <div>
                                                <p className="text-xs font-bold">Discord</p>
                                                <p className="text-[10px] text-foreground/40">{kol.platforms.discord.handle}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-indigo-400">{formatReach(kol.platforms.discord.members)}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Content Types */}
                    {kol.contentTypes?.length > 0 && (
                        <section className="glass p-6 rounded-2xl">
                            <h2 className="font-display font-black text-xs uppercase tracking-widest text-foreground/30 mb-4">Content Formats</h2>
                            <div className="flex flex-wrap gap-2">
                                {kol.contentTypes.map(c => (
                                    <span key={c} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-accent-primary/8 border border-accent-primary/15 text-accent-primary/80">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Languages */}
                    {kol.languages?.length > 0 && (
                        <section className="glass p-6 rounded-2xl">
                            <h2 className="font-display font-black text-xs uppercase tracking-widest text-foreground/30 mb-4">Languages</h2>
                            <div className="flex flex-wrap gap-2">
                                {kol.languages.map(l => (
                                    <span key={l} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-foreground/60">
                                        {l}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Wallet */}
                    {kol.walletAddress && (
                        <section className="glass p-6 rounded-2xl">
                            <h2 className="font-display font-black text-xs uppercase tracking-widest text-foreground/30 mb-3">Wallet</h2>
                            <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                                <span className="text-xs font-mono text-foreground/50 truncate max-w-[160px]">{kol.walletAddress}</span>
                                <button onClick={copyWallet} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-2">
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-foreground/40" />}
                                </button>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right column — campaigns */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Past Collaborations */}
                    <section className="glass p-6 sm:p-8 rounded-2xl">
                        <h2 className="font-display font-black text-lg uppercase tracking-widest text-foreground/30 mb-6 flex items-center gap-3">
                            Past Collaborations
                            <span className="text-[10px] font-black text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 rounded-full">{kol.campaigns?.length || 0}</span>
                        </h2>

                        {!kol.campaigns?.length ? (
                            <p className="text-foreground/20 italic text-sm">No collaborations listed yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {kol.campaigns.map((c, i) => {
                                    const isTweet = c.proofUrl && /x\.com|twitter\.com/.test(c.proofUrl);
                                    return (
                                    <div key={c.id || i} className="p-4 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary/20 to-pink-500/10 border border-accent-primary/20 flex items-center justify-center font-black text-accent-primary text-sm flex-shrink-0">
                                                {c.projectName?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div>
                                                        <span className="font-black text-sm">{c.projectName}</span>
                                                        <span className="ml-2 text-[10px] font-bold text-accent-primary/60 bg-accent-primary/8 border border-accent-primary/15 px-2 py-0.5 rounded-full">{c.type}</span>
                                                        {c.year && <span className="ml-1 text-[10px] text-foreground/30 font-bold">{c.year}</span>}
                                                    </div>
                                                    {c.proofUrl && !isTweet && (
                                                        <a href={c.proofUrl} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-foreground/30 hover:text-accent-primary transition-colors flex-shrink-0">
                                                            <ExternalLink className="w-2.5 h-2.5" /> Proof
                                                        </a>
                                                    )}
                                                </div>
                                                {c.result && (
                                                    <div className="flex items-center gap-1.5">
                                                        <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                                        <p className="text-xs text-emerald-400 font-bold">{c.result}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isTweet && (
                                            <div className="mt-3">
                                                <TweetEmbed url={c.proofUrl!} />
                                            </div>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* CTA if no collaborations */}
                    {isOwn && !kol.campaigns?.length && (
                        <div className="glass border border-dashed border-accent-primary/20 rounded-2xl p-6 text-center">
                            <TrendingUp className="w-8 h-8 text-accent-primary/30 mx-auto mb-3" />
                            <p className="text-sm font-bold text-foreground/40 mb-4">Add past collaborations to showcase your track record to projects</p>
                            <Link href="/kols/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Edit Profile
                            </Link>
                        </div>
                    )}

                    {/* Contact CTA for non-owners */}
                    {!isOwn && kol.openToCollabs && (
                        <div className="relative overflow-hidden glass border border-accent-primary/20 rounded-2xl p-6 sm:p-8">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-pink-500/3 pointer-events-none" />
                            <div className="relative">
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary mb-2">Want to Work Together?</p>
                                <h3 className="text-xl font-black uppercase tracking-tight mb-2">{kol.displayName} is open to offers</h3>
                                <p className="text-sm text-foreground/40 font-medium mb-5">
                                    {kol.minBudget && kol.minBudget > 0
                                        ? `Projects from $${kol.minBudget}. Reach out directly to discuss what you have in mind.`
                                        : 'Reach out directly to discuss your project and what you have to offer.'
                                    }
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {twitterHandle && (
                                        <a
                                            href={`https://x.com/${twitterHandle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                                            </svg>
                                            DM on X
                                        </a>
                                    )}
                                    <button onClick={copyContact} className="flex items-center gap-2 px-5 py-2.5 glass border border-white/10 text-foreground/60 font-black text-xs uppercase tracking-widest rounded-xl hover:border-white/20 transition-all">
                                        {contactCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        {contactCopied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback Section */}
            <KOLFeedbackSection kolId={id} kolName={kol.displayName} reputationScore={kol.reputationScore} />

            {/* KOL Badge Payment Modal */}
            <PaymentModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                onConfirm={handleBadgePurchase}
                amount={PRICES.KOL_BADGE}
                description="KOL Verified Badge"
                loading={badgeLoading}
            />
            <BadgeSuccessModal
                isOpen={showKolSuccess}
                type="kol"
                onClose={() => setShowKolSuccess(false)}
            />
        </div>
    );
}
