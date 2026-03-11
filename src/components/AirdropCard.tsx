'use client';

import { Airdrop } from '@/lib/types';
import { Sparkles, Users, Database, Shield, ArrowRight, CheckCircle2, BadgeCheck, Share2, Check } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AirdropCardProps {
    airdrop: Airdrop;
}

const AirdropCard = ({ airdrop }: AirdropCardProps) => {
    const { trackedAirdrops, toggleTrackAirdrop } = useAppContext();
    const isTracked = trackedAirdrops.includes(airdrop.id);
    const [copied, setCopied] = useState(false);
    const [hasNewTasks, setHasNewTasks] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const lastViewedRaw = localStorage.getItem(`airdrop_viewed_${airdrop.id}`);
            if (lastViewedRaw && (airdrop.updatedAt || airdrop.createdAt)) {
                const lastViewed = parseInt(lastViewedRaw, 10);
                const updateTime = (airdrop.updatedAt || airdrop.createdAt)?.toMillis?.() || 0;
                if (updateTime > lastViewed) {
                    setHasNewTasks(true);
                }
            }
        }
    }, [airdrop]);

    const handleShare = async () => {
        const url = `${window.location.origin}/airdrops/${airdrop.id}`;
        const text = `⚡ ${airdrop.projectName} Airdrop — ${airdrop.potentialReward} potential rewards\n\nTrack it on W3Hub:`;
        if (navigator.share) {
            try { await navigator.share({ title: airdrop.projectName, text, url }); } catch { }
        } else {
            navigator.clipboard.writeText(`${text} ${url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="glass p-8 group hover:border-accent-secondary/30 transition-all duration-500 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent-secondary/10 transition-colors" />

            <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8 mb-2 md:mb-8">
                <div className="flex items-start gap-4 md:gap-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-110 transition-transform duration-500 relative">
                        {airdrop.logoUrl ? (
                            <img src={airdrop.logoUrl} alt={airdrop.projectName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-accent-secondary" />
                        )}
                        <div className={`absolute -bottom-2 -right-2 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-background flex items-center justify-center ${airdrop.status === 'Live' ? 'bg-accent-success' : 'bg-accent-warning'
                            }`}>
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                            <h3 className="font-display font-black text-2xl tracking-tight">{airdrop.projectName}</h3>
                            {airdrop.paymentStatus === 'verified' && (
                                <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" />
                            )}
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-foreground/40 uppercase">
                                {airdrop.blockchain}
                            </span>
                            {hasNewTasks && (
                                <span className="px-2 py-0.5 rounded bg-accent-secondary/20 border border-accent-secondary/50 text-[10px] font-black text-accent-secondary uppercase flex items-center gap-1 animate-pulse">
                                    <Sparkles className="w-3 h-3" /> New Tasks
                                </span>
                            )}
                        </div>
                        <p className="text-foreground/60 text-sm max-w-md leading-relaxed">
                            {airdrop.description}
                        </p>
                    </div>
                </div>

                <div className="flex flex-row md:flex-col gap-6 md:gap-4 justify-start md:justify-end border-t border-white/5 md:border-none pt-4 md:pt-0 mt-2 md:mt-0">
                    <div className="flex flex-col text-left md:text-right">
                        <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Rewards</span>
                        <span className="text-lg md:text-xl font-black text-accent-success">{airdrop.potentialReward}</span>
                    </div>
                    <div className="flex flex-col text-left md:text-right">
                        <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Difficulty</span>
                        <span className={`text-sm font-bold ${airdrop.difficulty === 'Easy' ? 'text-accent-success' : airdrop.difficulty === 'Medium' ? 'text-accent-warning' : 'text-accent-secondary'
                            }`}>{airdrop.difficulty}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-6">
                    <div className="flex items-center gap-1.5 md:gap-2 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                        <Database className="w-3 h-3 text-accent-success" />
                        {airdrop.fundingAmount} Raised
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleShare}
                        title="Share this airdrop"
                        className={`p-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 border ${copied
                            ? 'bg-accent-success/10 text-accent-success border-accent-success/20'
                            : 'bg-white/5 hover:bg-white/10 border-white/5 text-foreground/40 hover:text-foreground'
                            }`}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => toggleTrackAirdrop(airdrop.id)}
                        className={`flex-grow sm:flex-grow-0 px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${isTracked
                            ? 'bg-accent-success/10 text-accent-success border border-accent-success/20'
                            : 'bg-white/5 hover:bg-white/10 border border-white/5'
                            }`}
                    >
                        {isTracked ? <CheckCircle2 className="w-4 h-4" /> : null}
                        {isTracked ? 'Tracking' : 'Track Alpha'}
                    </button>
                    <Link
                        href={`/airdrops/${airdrop.id}`}
                        className="flex-grow sm:flex-grow-0 px-8 py-3 bg-accent-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2 group/btn shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    >
                        GUIDE
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AirdropCard;
