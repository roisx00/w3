'use client';

import { useEffect, useState } from 'react';
import { X, Zap, Gift } from 'lucide-react';
import { checkBadgePromo, checkKolBadgePromo } from '@/lib/promos';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';

export default function PromoBanner() {
    const { user } = useAppContext();
    const [resumeRemaining, setResumeRemaining] = useState<number | null>(null);
    const [kolRemaining, setKolRemaining] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(true); // start hidden until loaded

    useEffect(() => {
        // Check if dismissed this session
        const key = 'w3hub_promo_dismissed_v2';
        if (sessionStorage.getItem(key)) return;

        // Only show for logged-in users who don't have both badges
        if (!user?.id) return;

        const alreadyHasBothBadges = user.hasBadge && (user as any).kolBadge;
        if (alreadyHasBothBadges) return;

        Promise.all([checkBadgePromo(), checkKolBadgePromo()]).then(([resume, kol]) => {
            const showResume = resume.isFree && !user.hasBadge;
            const showKol = kol.isFree;

            if (!showResume && !showKol) return;

            setResumeRemaining(showResume ? resume.remaining : null);
            setKolRemaining(showKol ? kol.remaining : null);
            setDismissed(false);
        }).catch(() => {});
    }, [user?.id]);

    const handleDismiss = () => {
        sessionStorage.setItem('w3hub_promo_dismissed_v2', '1');
        setDismissed(true);
    };

    if (dismissed || (resumeRemaining === null && kolRemaining === null)) return null;

    return (
        <div className="fixed top-[64px] left-0 right-0 z-40 flex justify-center px-4 pt-2 pointer-events-none">
            <div className="pointer-events-auto max-w-2xl w-full bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl shadow-black/30 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-foreground/90 leading-tight flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="flex items-center gap-1 text-amber-400"><Zap className="w-3 h-3" /> Early Launch Offer</span>
                        {resumeRemaining !== null && (
                            <span className="text-foreground/70">
                                <span className="text-amber-400 font-black">{resumeRemaining} free</span> Resume Badges left
                            </span>
                        )}
                        {resumeRemaining !== null && kolRemaining !== null && (
                            <span className="text-foreground/30">·</span>
                        )}
                        {kolRemaining !== null && (
                            <span className="text-foreground/70">
                                <span className="text-purple-400 font-black">{kolRemaining} free</span> KOL Badges left
                            </span>
                        )}
                    </p>
                    <p className="text-[9px] text-foreground/40 font-medium mt-0.5">
                        First 50 of each badge are completely free — claim yours before they&apos;re gone
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href="/dashboard"
                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap">
                        Claim Now
                    </Link>
                    <button onClick={handleDismiss} className="p-1 text-foreground/20 hover:text-foreground/60 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
