'use client';

import { useState } from 'react';
import { TalentProfile } from '@/lib/types';
import { Twitter, Send, Github, Globe, MapPin, Briefcase, ExternalLink, CheckCircle2, Eye, Bookmark } from 'lucide-react';
import Link from 'next/link';
import GoldBadge from '@/components/GoldBadge';
import FounderBadge from '@/components/FounderBadge';
import { useAppContext } from '@/context/AppContext';
import { computeTalentW3Score, getW3Tier } from '@/lib/w3score';

interface TalentCardProps {
    talent: TalentProfile;
}

const TalentCard = ({ talent }: TalentCardProps) => {
    const { user, savedResumes, toggleSaveResume } = useAppContext();
    const [copied, setCopied] = useState(false);

    const isFounder = user?.roles?.includes('Founder');
    const isSaved = savedResumes.includes(talent.id!);
    const w3Score = computeTalentW3Score(talent);
    const tier = getW3Tier(w3Score);

    const handleCopyWallet = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!talent.walletAddress) return;
        navigator.clipboard.writeText(talent.walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass p-6 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group border-white/5 hover:border-accent-primary/20 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center border border-accent-primary/30 overflow-hidden font-display font-bold text-accent-primary shadow-[0_0_10px_rgba(0,242,255,0.2)]">
                            {talent.photoUrl ? (
                                <img src={talent.photoUrl} alt={talent.displayName} className="w-full h-full object-cover" />
                            ) : (
                                talent.displayName.charAt(0)
                            )}
                        </div>
                        {talent.hasBadge && (
                            <div className="absolute -bottom-1 -right-1">
                                <GoldBadge size={16} />
                            </div>
                        )}
                        {talent.isFounderVerified && (
                            <div className="absolute -top-1 -right-1">
                                <FounderBadge size={16} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-lg leading-none">{talent.displayName}</h3>
                            {talent.hasBadge && <GoldBadge size={16} />}
                            {talent.isFounderVerified && <FounderBadge size={16} />}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground/40 font-medium tracking-tight">@{talent.username}</span>
                            {talent.openToWork && (
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-accent-success/10 border border-accent-success/30 text-accent-success rounded-full">
                                    Open to Work
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {talent.views !== undefined && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-foreground/30" title="Total profile views">
                            <Eye className="w-2.5 h-2.5" />
                            {talent.views}
                        </div>
                    )}
                    {talent.githubStats && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white" title="Verified GitHub Stats">
                            <Github className="w-2.5 h-2.5" />
                            {talent.githubStats.followers}
                        </div>
                    )}
                    {isFounder && (
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSaveResume(talent.id!);
                            }}
                            className={`p-1.5 rounded-lg border transition-all ${
                                isSaved 
                                    ? 'bg-accent-secondary border-accent-secondary text-white' 
                                    : 'border-white/5 text-foreground/20 hover:text-accent-secondary hover:border-accent-secondary/50'
                            }`}
                            title={isSaved ? "Remove from Saved" : "Save Resume"}
                        >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border ${tier.bg} ${tier.border}`}
                        style={tier.glow ? { boxShadow: tier.glow } : {}}>
                        <div className="leading-none">
                            <p className={`text-[7px] font-black uppercase tracking-widest opacity-60 ${tier.color}`}>W3</p>
                            <div className="flex items-baseline gap-0.5">
                                <span className={`text-sm font-black leading-none ${tier.color}`}>{w3Score}</span>
                                <span className="text-[7px] text-foreground/25 font-bold">/1k</span>
                            </div>
                            <p className={`text-[7px] font-black uppercase tracking-widest opacity-70 ${tier.color}`}>{tier.label}</p>
                        </div>
                        <div className="w-8 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${tier.color}`}
                                style={{ width: `${w3Score / 10}%`, background: 'currentColor' }} />
                        </div>
                    </div>
                    <Link
                        href={`/talents/${talent.username || encodeURIComponent(talent.id)}`}
                        className="p-2 glass hover:bg-white/10 rounded-lg transition-colors group/link"
                    >
                        <ExternalLink className="w-4 h-4 text-accent-primary group-hover/link:scale-110 transition-transform" />
                    </Link>
                </div>
            </div>

            <p className="text-sm text-foreground/70 mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                {talent.bio}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
                {(talent.roles ?? []).slice(0, 2).map((role) => (
                    <span key={role} className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10 text-foreground/60">
                        {role}
                    </span>
                ))}
                {(talent.roles ?? []).length > 2 && (
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10 text-foreground/60">
                        +{talent.roles.length - 2}
                    </span>
                )}
            </div>

            <div className="flex gap-4 mb-6 mt-auto">
                {talent.socials.twitter && (
                    <a
                        href={`https://twitter.com/${talent.socials.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 glass-pill text-foreground/40 hover:text-accent-primary transition-colors border-white/5"
                    >
                        <Twitter className="w-4 h-4" />
                    </a>
                )}
                {talent.walletAddress && (
                    <button
                        onClick={handleCopyWallet}
                        className="flex-grow py-2 glass-pill text-[10px] font-bold tracking-widest uppercase text-foreground/40 hover:text-accent-primary transition-colors border-white/5 flex items-center justify-center gap-1.5"
                    >
                        {copied ? <CheckCircle2 className="w-3 h-3 text-accent-success" /> : null}
                        {copied ? 'Copied!' : 'Copy Wallet'}
                    </button>
                )}
            </div>

            <Link
                href={`/talents/${talent.username || encodeURIComponent(talent.id)}`}
                className="block w-full py-3 bg-accent-primary text-white text-center rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-sm hover:shadow-md hover:bg-accent-secondary"
            >
                View Full Profile
            </Link>
        </div>
    );
};

export default TalentCard;
