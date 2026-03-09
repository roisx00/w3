'use client';

import { useState } from 'react';
import { TalentProfile } from '@/lib/types';
import { Twitter, Send, Github, Globe, MapPin, Briefcase, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface TalentCardProps {
    talent: TalentProfile;
}

const TalentCard = ({ talent }: TalentCardProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopyWallet = () => {
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
                        {talent.openToWork && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent-success border-2 border-background flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-accent-success animate-ping absolute" />
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-lg leading-none">{talent.displayName}</h3>
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
                <Link
                    href={`/talents/${talent.id}`}
                    className="p-2 glass hover:bg-white/10 rounded-lg transition-colors group/link"
                >
                    <ExternalLink className="w-4 h-4 text-accent-primary group-hover/link:scale-110 transition-transform" />
                </Link>
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
                href={`/talents/${talent.id}`}
                className="block w-full py-3 bg-accent-primary text-white text-center rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-sm hover:shadow-md hover:bg-accent-secondary"
            >
                View Full Profile
            </Link>
        </div>
    );
};

export default TalentCard;
