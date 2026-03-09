'use client';

import { useAppContext } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { checkBadgePromo } from '@/lib/promos';
import { JobPosting, Airdrop } from '@/lib/types';
import { Briefcase, Zap, Settings, Award, Clock, ArrowUpRight, Edit3, BadgeCheck, TrendingUp, Lock, Radio } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import { PRICES } from '@/lib/payments';
import Link from 'next/link';

import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}

function DashboardContent() {
    const { user, bookmarkedJobs, trackedAirdrops, updateProfile } = useAppContext();
    const [savedJobsData, setSavedJobsData] = useState<JobPosting[]>([]);
    const [trackedAirdropsData, setTrackedAirdropsData] = useState<Airdrop[]>([]);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showBoostModal, setShowBoostModal] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [isBadgePromoFree, setIsBadgePromoFree] = useState(false);
    const [badgesRemaining, setBadgesRemaining] = useState(0);

    useEffect(() => {
        if (!user?.hasBadge && !user?.hasBadgePending) {
            checkBadgePromo().then(({ isFree, remaining }) => {
                setIsBadgePromoFree(isFree);
                setBadgesRemaining(remaining);
            });
        }
    }, [user?.id]);

    useEffect(() => {
        async function fetchSaved() {
            if (bookmarkedJobs.length > 0) {
                const results = await Promise.all(
                    bookmarkedJobs.map(id => getDoc(doc(db, 'jobs', id)))
                );
                setSavedJobsData(
                    results.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as JobPosting))
                );
            } else {
                setSavedJobsData([]);
            }
        }
        fetchSaved();
    }, [bookmarkedJobs]);

    useEffect(() => {
        async function fetchTracked() {
            if (trackedAirdrops.length > 0) {
                const results = await Promise.all(
                    trackedAirdrops.map(id => getDoc(doc(db, 'airdrops', id)))
                );
                setTrackedAirdropsData(
                    results.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as Airdrop))
                );
            } else {
                setTrackedAirdropsData([]);
            }
        }
        fetchTracked();
    }, [trackedAirdrops]);

    // Compute profile completion %
    const profileFields = [user?.displayName, user?.bio, user?.walletAddress, user?.roles?.length, user?.skills?.length, user?.resumeUrl];
    const profilePct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

    const handleFreeBadge = async () => {
        if (!user?.id) return;
        setPaymentLoading(true);
        try {
            await updateDoc(doc(db, 'talents', user.id), { hasBadge: true });
            updateProfile({ hasBadge: true } as any);
        } catch (err) {
            alert('Failed to activate badge. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleBadgePayment = async (txHash: string) => {
        if (!user?.id) return;
        setPaymentLoading(true);
        try {
            // Payment already verified on-chain by PaymentModal — activate immediately
            await addDoc(collection(db, 'payments'), {
                userId: user.id,
                userEmail: user.email || '',
                userDisplayName: user.displayName || '',
                type: 'user_badge',
                amount: PRICES.USER_BADGE,
                txHash,
                status: 'verified',
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, 'talents', user.id), { hasBadge: true, hasBadgePending: false, badgeTxHash: txHash });
            updateProfile({ hasBadge: true, hasBadgePending: false, badgeTxHash: txHash } as any);
            setShowBadgeModal(false);
        } catch (err) {
            alert('Failed to activate badge. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCvBoostPayment = async (txHash: string) => {
        if (!user?.id) return;
        setPaymentLoading(true);
        try {
            await addDoc(collection(db, 'payments'), {
                userId: user.id,
                userEmail: user.email || '',
                userDisplayName: user.displayName || '',
                type: 'cv_boost',
                amount: PRICES.CV_BOOST_MONTHLY,
                txHash,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setShowBoostModal(false);
            alert('CV Boost payment submitted! Your profile will be pinned to the top within 24h.');
        } catch (err) {
            alert('Failed to submit CV boost payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar / Profile Card */}
                <aside className="lg:col-span-1 space-y-8">
                    <div className="glass p-6 text-center border-accent-primary/20 bg-accent-primary/5">
                        <div className="w-20 h-20 rounded-2xl bg-accent-primary/20 border border-accent-primary/30 mx-auto mb-4 flex items-center justify-center font-display font-black text-2xl text-accent-primary overflow-hidden">
                            {user?.photoUrl ? (
                                <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                (user?.displayName || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <h3 className="font-display font-black text-xl mb-1">{user?.displayName || 'Anonymous'}</h3>
                        <span className="text-xs text-foreground/40 font-bold tracking-widest uppercase">{user?.roles?.length ? user.roles[0] : 'Web3 Professional'}</span>

                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-foreground/40 mb-1">
                                <span>Profile Completion</span>
                                <span className="text-accent-primary">{profilePct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-primary shadow-[0_0_10px_rgba(0,242,255,0.5)] transition-all duration-700" style={{ width: `${profilePct}%` }} />
                            </div>
                        </div>
                    </div>

                    <nav className="glass p-4 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl text-accent-primary font-bold text-sm">
                            <Award className="w-4 h-4" /> Overview
                        </Link>
                        <Link href={`/talents/${user?.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <Settings className="w-4 h-4" /> My Resume
                        </Link>
                        <Link href="/onboarding" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <Edit3 className="w-4 h-4" /> Edit Profile
                        </Link>
                    </nav>

                    {/* Badge & Boost Status */}
                    <div className="glass p-5 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Access & Boosts</p>

                        {user?.hasBadge ? (
                            <div className="flex items-center gap-2 text-accent-success text-xs font-black">
                                <BadgeCheck className="w-4 h-4" /> Badge Active
                            </div>
                        ) : user?.hasBadgePending ? (
                            <div className="flex items-center gap-2 text-accent-warning text-xs font-black">
                                <Clock className="w-4 h-4" /> Badge Pending Verification
                            </div>
                        ) : (
                            <button
                                onClick={() => isBadgePromoFree ? handleFreeBadge() : setShowBadgeModal(true)}
                                disabled={paymentLoading}
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-colors disabled:opacity-50"
                            >
                                <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Get Badge</span>
                                {isBadgePromoFree
                                    ? <span className="text-accent-success">FREE ({badgesRemaining} left)</span>
                                    : <span>${PRICES.USER_BADGE} USDC</span>
                                }
                            </button>
                        )}

                        {user?.cvBoosted ? (
                            <div className="flex items-center gap-2 text-accent-secondary text-xs font-black">
                                <TrendingUp className="w-4 h-4" /> CV Boosted
                                {user?.cvBoostExpiry && (
                                    <span className="text-foreground/30 font-medium">until {new Date(user.cvBoostExpiry).toLocaleDateString()}</span>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowBoostModal(true)}
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-secondary/20 transition-colors"
                            >
                                <span className="flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Boost CV</span>
                                <span>${PRICES.CV_BOOST_MONTHLY}/mo</span>
                            </button>
                        )}

                        {/* Open to Work toggle */}
                        <div className="pt-1 border-t border-white/5">
                            <button
                                onClick={() => updateProfile({ openToWork: !user?.openToWork } as any)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    user?.openToWork
                                        ? 'bg-accent-success/10 border border-accent-success/30 text-accent-success'
                                        : 'bg-white/5 border border-white/10 text-foreground/40 hover:border-white/20'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Radio className="w-3 h-3" />
                                    {user?.openToWork ? 'Open to Work' : 'Not Looking'}
                                </span>
                                <div className={`w-8 h-4 rounded-full transition-colors relative ${user?.openToWork ? 'bg-accent-success' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${user?.openToWork ? 'left-4' : 'left-0.5'}`} />
                                </div>
                            </button>
                            <p className="text-[9px] text-foreground/20 font-medium mt-1.5 px-1">
                                {user?.openToWork ? 'Projects can see you\'re available for hire' : 'Toggle on to signal you\'re available'}
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-3 space-y-12">
                    {/* Quick Stats */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Briefcase className="w-5 h-5 text-accent-primary" />
                                <span className="text-[10px] font-bold text-foreground/20">SAVED</span>
                            </div>
                            <span className="text-3xl font-black block mb-1">{bookmarkedJobs.length}</span>
                            <span className="text-xs font-bold text-foreground/40 tracking-tight">Saved Jobs</span>
                        </div>
                        <div className="glass p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Zap className="w-5 h-5 text-accent-secondary" />
                                <span className="text-[10px] font-bold text-foreground/20">TRACKING</span>
                            </div>
                            <span className="text-3xl font-black block mb-1">{trackedAirdrops.length}</span>
                            <span className="text-xs font-bold text-foreground/40 tracking-tight">Tracked Airdrops</span>
                        </div>
                        <div className="glass p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Clock className="w-5 h-5 text-accent-success" />
                                <span className="text-[10px] font-bold text-foreground/20">COMPLETE</span>
                            </div>
                            <span className="text-3xl font-black block mb-1">{profilePct}%</span>
                            <span className="text-xs font-bold text-foreground/40 tracking-tight">Profile Complete</span>
                        </div>
                    </section>

                    {/* Saved Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                            <h4 className="font-display font-black text-xl mb-6 flex items-center gap-3">
                                Saved Jobs
                                <span className="px-2 py-0.5 bg-white/5 text-[10px] rounded text-foreground/40">{savedJobsData.length}</span>
                            </h4>
                            <div className="space-y-4">
                                {savedJobsData.length > 0 ? savedJobsData.map(job => (
                                    <Link key={job.id} href={`/jobs/${job.id}`} className="glass p-4 group hover:border-accent-primary/30 transition-colors flex justify-between items-center">
                                        <div>
                                            <h5 className="font-bold text-sm mb-1">{job.roleNeeded}</h5>
                                            <p className="text-[10px] font-bold text-accent-primary tracking-tighter uppercase">{job.projectName}</p>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-foreground/20 group-hover:text-accent-primary transition-colors" />
                                    </Link>
                                )) : (
                                    <p className="text-sm text-foreground/20 italic">No jobs bookmarked yet.</p>
                                )}
                            </div>
                        </section>

                        <section>
                            <h4 className="font-display font-black text-xl mb-6 flex items-center gap-3">
                                Tracked Airdrops
                                <span className="px-2 py-0.5 bg-white/5 text-[10px] rounded text-foreground/40">{trackedAirdropsData.length}</span>
                            </h4>
                            <div className="space-y-4">
                                {trackedAirdropsData.length > 0 ? trackedAirdropsData.map(airdrop => (
                                    <Link key={airdrop.id} href={`/airdrops/${airdrop.id}`} className="glass p-4 group hover:border-accent-secondary/30 transition-colors flex justify-between items-center">
                                        <div>
                                            <h5 className="font-bold text-sm mb-1">{airdrop.projectName}</h5>
                                            <p className="text-[10px] font-bold text-accent-secondary tracking-tighter uppercase">{airdrop.blockchain}</p>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-foreground/20 group-hover:text-accent-secondary transition-colors" />
                                    </Link>
                                )) : (
                                    <p className="text-sm text-foreground/20 italic">Not tracking any airdrops.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            <PaymentModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                onConfirm={handleBadgePayment}
                amount={PRICES.USER_BADGE}
                description="Access Badge (One-time)"
                loading={paymentLoading}
            />
            <PaymentModal
                isOpen={showBoostModal}
                onClose={() => setShowBoostModal(false)}
                onConfirm={handleCvBoostPayment}
                amount={PRICES.CV_BOOST_MONTHLY}
                description="CV Top Boost (30 days)"
                loading={paymentLoading}
            />
        </div>
    );
}
