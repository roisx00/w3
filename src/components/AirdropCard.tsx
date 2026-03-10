'use client';

import { Airdrop } from '@/lib/types';
import { Sparkles, Users, Database, Shield, ArrowRight, CheckCircle2, BadgeCheck, Share2, Check } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';
import Link from 'next/link';

interface AirdropCardProps {
    airdrop: Airdrop;
}

const AirdropCard = ({ airdrop }: AirdropCardProps) => {
    const { trackedAirdrops, toggleTrackAirdrop } = useAppContext();
    const isTracked = trackedAirdrops.includes(airdrop.id);
    const [copied, setCopied] = useState(false);

    // Check if tasks were updated in the last 7 days
    const hasNewTasks = (() => {
        if (!airdrop.lastTaskUpdate) return false;
        const updated = airdrop.lastTaskUpdate?.toDate ? airdrop.lastTaskUpdate.toDate() : new Date(airdrop.lastTaskUpdate);
        return (Date.now() - updated.getTime()) < 7 * 24 * 60 * 60 * 1000;
    })();

    // Normalize task to display text
    const getTaskText = (t: any) => typeof t === 'string' ? t : t?.text ?? '';

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

            <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-110 transition-transform duration-500 relative">
                        {airdrop.logoUrl ? (
                            <img src={airdrop.logoUrl} alt={airdrop.projectName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <Sparkles className="w-8 h-8 text-accent-secondary" />
                        )}
                        <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center ${airdrop.status === 'Live' ? 'bg-accent-success' : 'bg-accent-warning'
                            }`}>
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display font-black text-2xl tracking-tight">{airdrop.projectName}</h3>
                            {airdrop.paymentStatus === 'verified' && (
                                <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" />
                            )}
                            {hasNewTasks && (
                                <span className="px-2 py-0.5 rounded-full bg-accent-success/15 border border-accent-success/30 text-[10px] font-black text-accent-success uppercase tracking-widest animate-pulse">
                                    🔥 New Tasks
                                </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-foreground/40 uppercase">
                                {airdrop.blockchain}
                            </span>
                        </div>
                        <p className="text-foreground/60 text-sm max-w-md leading-relaxed">
                            {airdrop.description}
                        </p>
                    </div>
                </div>

                <div className="flex flex-row md:flex-col gap-4 text-right justify-end md:justify-start">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Rewards</span>
                        <span className="text-xl font-black text-accent-success">{airdrop.potentialReward}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Difficulty</span>
                        <span className={`text-sm font-bold ${airdrop.difficulty === 'Easy' ? 'text-accent-success' : airdrop.difficulty === 'Medium' ? 'text-accent-warning' : 'text-accent-secondary'
                            }`}>{airdrop.difficulty}</span>
                    </div>
                </div>
            </div>

            {/* Task List Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {(airdrop.tasks ?? []).slice(0, 3).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-accent-secondary/40 shrink-0" />
                        <span className="text-xs font-medium text-foreground/70 truncate">{getTaskText(t)}</span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                        <Users className="w-3 h-3 text-accent-primary" />
                        {airdrop.participationCount} Participants
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
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
