'use client';

import { use, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { Airdrop } from '@/lib/types';
import {
    Sparkles, Users, Database, Shield,
    ArrowLeft, CheckCircle2, Circle,
    ExternalLink, Twitter, Globe, Info, Clock, AlertCircle, Copy, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import PaymentModal from '@/components/PaymentModal';
import { PRICES } from '@/lib/payments';

export default function AirdropDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, updateProfile } = useAppContext();
    const [airdrop, setAirdrop] = useState<Airdrop | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);
    const [shareCopied, setShareCopied] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [badgeLoading, setBadgeLoading] = useState(false);

    const hasBadgeAccess = !!(user?.hasBadge || user?.hasBadgePending);

    // Load completed tasks from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`airdrop_tasks_${id}`);
        if (saved) setCompletedTasks(JSON.parse(saved));
    }, [id]);

    useEffect(() => {
        async function fetchAirdrop() {
            try {
                const docRef = doc(db, 'airdrops', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setAirdrop({
                        id: docSnap.id,
                        ...docSnap.data()
                    } as Airdrop);
                }
            } catch (err) {
                console.error('Error fetching airdrop:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAirdrop();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Fetching Alpha Details...</p>
            </div>
        );
    }

    if (!airdrop) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Airdrop guide not found</h2>
                <Link href="/airdrops" className="text-accent-primary hover:underline">Return to Hub</Link>
            </div>
        );
    }

    const toggleTask = (task: string) => {
        if (!hasBadgeAccess) {
            setShowBadgeModal(true);
            return;
        }
        setCompletedTasks(prev => {
            const next = prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task];
            localStorage.setItem(`airdrop_tasks_${id}`, JSON.stringify(next));
            return next;
        });
    };

    const handleBadgePayment = async (txHash: string) => {
        if (!user?.id) return;
        setBadgeLoading(true);
        try {
            await setDoc(doc(db, 'talents', user.id), {
                hasBadgePending: true,
                badgeTxHash: txHash,
            }, { merge: true });

            await addDoc(collection(db, 'payments'), {
                userId: user.id,
                userEmail: user.email || '',
                userDisplayName: user.displayName || '',
                type: 'user_badge',
                amount: PRICES.USER_BADGE,
                txHash,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            updateProfile({ hasBadgePending: true, badgeTxHash: txHash } as any);
            setShowBadgeModal(false);
        } catch (err) {
            console.error('Badge payment error:', err);
            alert('Failed to submit. Please try again.');
        } finally {
            setBadgeLoading(false);
        }
    };

    const progress = airdrop.tasks.length > 0 ? Math.round((completedTasks.length / airdrop.tasks.length) * 100) : 0;

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <Link href="/airdrops" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors mb-12 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Hub</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Guide Content */}
                <div className="lg:col-span-2 space-y-12">
                    <header className="glass p-10 border-accent-secondary/20 bg-accent-secondary/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-secondary/5 rounded-full blur-[80px] -mr-32 -mt-32" />

                        <div className="flex items-center gap-6 mb-8 relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                                {airdrop.logoUrl ? (
                                    <img src={airdrop.logoUrl} alt={airdrop.projectName} className="w-full h-full object-cover" />
                                ) : (
                                    <Sparkles className="w-10 h-10 text-accent-secondary" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="font-display font-black text-3xl tracking-tight">{airdrop.projectName}</h1>
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] font-black uppercase rounded text-foreground/40">
                                        {airdrop.blockchain}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-foreground/40 text-sm font-bold">
                                    <span className="text-accent-secondary uppercase tracking-tighter">Alpha Guide</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                                        <Clock className="w-3 h-3" />
                                        {airdrop.status === 'Live' ? 'Live Now' : airdrop.status === 'Upcoming' ? 'Upcoming' : 'Ended'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-foreground/70 leading-relaxed mb-8 relative z-10 whitespace-pre-wrap">
                            {airdrop.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-white/5 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-foreground/20 uppercase mb-1">Potential Reward</p>
                                <p className="font-black text-xl text-accent-success">{airdrop.potentialReward}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground/20 uppercase mb-1">Difficulty</p>
                                <p className="font-black text-sm">{airdrop.difficulty}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground/20 uppercase mb-1">Funding</p>
                                <p className="font-black text-sm">{airdrop.fundingAmount}</p>
                            </div>
                        </div>
                    </header>

                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="font-display font-black text-2xl flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-accent-success" />
                                Task Checklist
                            </h2>
                            <div className="flex items-center gap-4">
                                {hasBadgeAccess ? (
                                    <>
                                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{progress}% Complete</span>
                                        <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent-success shadow-[0_0_10px_rgba(0,255,170,0.5)] transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setShowBadgeModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-colors"
                                    >
                                        <Lock className="w-3 h-3" /> Get Badge — ${PRICES.USER_BADGE}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!hasBadgeAccess && (
                            <div className="mb-6 flex items-start gap-4 p-5 bg-accent-primary/5 border border-accent-primary/20 rounded-2xl">
                                <Lock className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black text-sm mb-1">Access Badge Required</p>
                                    <p className="text-xs text-foreground/50 font-medium">
                                        Get your <strong className="text-accent-primary">${PRICES.USER_BADGE} USDC</strong> one-time Access Badge to track airdrop tasks and upload your resume.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {airdrop.tasks.map((task, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleTask(task)}
                                    className={`w-full glass p-6 flex items-center justify-between group transition-all text-left ${
                                        hasBadgeAccess && completedTasks.includes(task)
                                            ? 'border-accent-success/30 bg-accent-success/5'
                                            : 'hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`transition-colors ${
                                            !hasBadgeAccess
                                                ? 'text-foreground/10'
                                                : completedTasks.includes(task)
                                                    ? 'text-accent-success'
                                                    : 'text-foreground/20 group-hover:text-foreground/40'
                                        }`}>
                                            {hasBadgeAccess && completedTasks.includes(task)
                                                ? <CheckCircle2 className="w-6 h-6" />
                                                : hasBadgeAccess
                                                    ? <Circle className="w-6 h-6" />
                                                    : <Lock className="w-5 h-5" />
                                            }
                                        </div>
                                        <span className={`font-bold transition-colors ${
                                            hasBadgeAccess && completedTasks.includes(task)
                                                ? 'text-foreground/40 line-through'
                                                : 'text-foreground/80'
                                        }`}>
                                            {task}
                                        </span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-foreground/10 group-hover:text-foreground/30 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="glass p-8 bg-accent-warning/5 border-accent-warning/20">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-accent-warning shrink-0 mt-1" />
                            <div>
                                <h3 className="font-black text-lg mb-2 text-accent-warning">Risk Disclaimer</h3>
                                <p className="text-sm text-foreground/60 leading-relaxed">
                                    Airdrop hunting involves interacting with smart contracts that may have vulnerabilities. Never share your seed phrase and always use a burner wallet when interacting with unverified protocols.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar - Project Stats & Links */}
                <aside className="space-y-8">
                    <div className="glass p-8 sticky top-32">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest mb-4">Project Alpha</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
                                            <Users className="w-3 h-3 text-accent-primary" /> Participants
                                        </div>
                                        <span className="text-xs font-black">{airdrop.participationCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
                                            <Shield className="w-3 h-3 text-accent-success" /> Confidence
                                        </div>
                                        <span className={`text-xs font-black ${airdrop.type === 'Confirmed' ? 'text-accent-success' : 'text-accent-warning'}`}>{airdrop.type === 'Confirmed' ? 'High' : 'Medium'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <h3 className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest mb-4">Official Links</h3>
                                <div className="space-y-3">
                                    <a href={airdrop.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent-secondary/30 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-foreground/40 group-hover:text-accent-secondary" />
                                            <span className="text-xs font-bold">Official Site</span>
                                        </div>
                                    </a>
                                    <a href={airdrop.twitter ? `https://twitter.com/${airdrop.twitter.replace('@', '')}` : '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent-secondary/30 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Twitter className="w-4 h-4 text-foreground/40 group-hover:text-accent-secondary" />
                                            <span className="text-xs font-bold">Twitter / X</span>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        setShareCopied(true);
                                        setTimeout(() => setShareCopied(false), 2000);
                                    }}
                                    className="w-full py-4 glass border-accent-secondary/30 text-accent-secondary font-black rounded-xl hover:bg-accent-secondary/5 transition-all text-sm flex items-center justify-center gap-2"
                                >
                                    {shareCopied ? <CheckCircle2 className="w-4 h-4 text-accent-success" /> : <Copy className="w-4 h-4" />}
                                    {shareCopied ? 'LINK COPIED!' : 'SHARE ALPHA'}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <PaymentModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                onConfirm={handleBadgePayment}
                amount={PRICES.USER_BADGE}
                description="Access Badge (One-time)"
                loading={badgeLoading}
            />
        </div>
    );
}
