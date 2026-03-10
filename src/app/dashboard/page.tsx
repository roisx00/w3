'use client';

import { useAppContext } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { checkBadgePromo } from '@/lib/promos';
import { JobPosting, Airdrop } from '@/lib/types';
import { Briefcase, Zap, Settings, Award, Clock, ArrowUpRight, Edit3, BadgeCheck, TrendingUp, Lock, Radio, Gift, Copy, Check, LogOut, FileText, PlusCircle } from 'lucide-react';
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
    const { user, bookmarkedJobs, trackedAirdrops, updateProfile, logReferralEarning, logout } = useAppContext();
    const [savedJobsData, setSavedJobsData] = useState<JobPosting[]>([]);
    const [trackedAirdropsData, setTrackedAirdropsData] = useState<Airdrop[]>([]);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showBoostModal, setShowBoostModal] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [isBadgePromoFree, setIsBadgePromoFree] = useState(false);
    const [badgesRemaining, setBadgesRemaining] = useState(0);
    const [applications, setApplications] = useState<any[]>([]);
    const [referralEarnings, setReferralEarnings] = useState<any[]>([]);
    const [copiedRef, setCopiedRef] = useState(false);

    const referralLink = user?.id
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://w3hub.space'}?ref=${user.id}`
        : '';

    const copyReferralLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
    };

    // Fetch referral earnings
    useEffect(() => {
        if (!user?.id) return;
        getDocs(query(
            collection(db, 'referrals'),
            where('referrerId', '==', user.id),
            orderBy('createdAt', 'desc')
        )).then(snap => {
            setReferralEarnings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => { });
    }, [user?.id]);

    // Fetch applications received for jobs this user posted
    useEffect(() => {
        if (!user?.id) return;
        getDocs(query(
            collection(db, 'applications'),
            where('posterId', '==', user.id),
            orderBy('createdAt', 'desc')
        )).then(snap => {
            setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => { }); // index may not exist yet — silent fail
    }, [user?.id]);

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
            await logReferralEarning('user_badge', PRICES.USER_BADGE, txHash, user as any);
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
                        <div className="pt-1 border-t border-white/5">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent-danger/10 rounded-xl text-foreground/40 hover:text-accent-danger transition-all font-bold text-sm"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
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
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user?.openToWork
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
                    {/* Quick Action Cards */}
                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-4">Quick Actions</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                href="/onboarding"
                                className="group glass p-6 hover:border-accent-primary/40 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-accent-primary/10 transition-colors" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                        <FileText className="w-6 h-6 text-accent-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-display font-black text-base uppercase tracking-tight mb-0.5 flex items-center gap-2">
                                            Build Your Resume
                                            <ArrowUpRight className="w-4 h-4 text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h3>
                                        <p className="text-xs text-foreground/40 font-medium">Create or update your Web3 profile</p>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                href="/jobs/new"
                                className="group glass p-6 hover:border-accent-secondary/40 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-accent-secondary/10 transition-colors" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-secondary/10 border border-accent-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                        <PlusCircle className="w-6 h-6 text-accent-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-display font-black text-base uppercase tracking-tight mb-0.5 flex items-center gap-2">
                                            Post a Job
                                            <ArrowUpRight className="w-4 h-4 text-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h3>
                                        <p className="text-xs text-foreground/40 font-medium">Hire Web3 talent for your project</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </section>
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

                        {/* Applications Received */}
                        {applications.length > 0 && (
                            <section>
                                <h4 className="font-display font-black text-xl mb-6 flex items-center gap-3">
                                    Applications Received
                                    <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] rounded font-black">{applications.length}</span>
                                </h4>
                                <div className="space-y-3">
                                    {applications.map((app: any) => (
                                        <div key={app.id} className="glass p-5 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary text-sm overflow-hidden shrink-0">
                                                        {app.applicantPhotoUrl
                                                            ? <img src={app.applicantPhotoUrl} alt="" className="w-full h-full object-cover" />
                                                            : app.applicantName?.charAt(0)
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{app.applicantName}</p>
                                                        <p className="text-[10px] text-foreground/40">@{app.applicantUsername} · {app.jobTitle} @ {app.projectName}</p>
                                                    </div>
                                                </div>
                                                <Link href={app.cvLink} target="_blank"
                                                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors shrink-0">
                                                    View CV
                                                </Link>
                                            </div>
                                            <p className="text-sm text-foreground/60 leading-relaxed pl-12">{app.coverNote}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Referral Program */}
                        <section className="glass p-8 border-accent-primary/20 bg-accent-primary/5">
                            <div className="flex items-center gap-3 mb-6">
                                <Gift className="w-5 h-5 text-accent-primary" />
                                <h4 className="font-display font-black text-xl">Referral Program</h4>
                                <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary text-[10px] font-black rounded-full uppercase tracking-widest">10% forever</span>
                            </div>

                            <p className="text-sm text-foreground/50 mb-6 leading-relaxed">
                                Share your referral link. Every time someone you referred pays for a job post, airdrop, or badge — you earn <strong className="text-foreground/80">10% of their payment</strong> in USDC, permanently.
                            </p>

                            {/* Referral link */}
                            <div className="flex items-center gap-2 glass bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
                                <span className="flex-1 text-xs font-mono text-foreground/50 truncate">{referralLink}</span>
                                <button onClick={copyReferralLink}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${copiedRef ? 'bg-accent-success/20 text-accent-success border border-accent-success/30' : 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/20'}`}>
                                    {copiedRef ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copiedRef ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            {/* Earnings */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="glass p-4 text-center">
                                    <p className="text-2xl font-black text-accent-success">{referralEarnings.length}</p>
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Referrals</p>
                                </div>
                                <div className="glass p-4 text-center">
                                    <p className="text-2xl font-black text-accent-success">
                                        ${referralEarnings.reduce((sum, r) => sum + (r.earning || 0), 0).toFixed(2)}
                                    </p>
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">USDC Earned</p>
                                </div>
                            </div>

                            {referralEarnings.length > 0 && (
                                <div className="space-y-2">
                                    {referralEarnings.slice(0, 5).map((r: any) => (
                                        <div key={r.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white/5 rounded-lg">
                                            <span className="text-foreground/60">{r.refereeName} · {r.paymentType.replace('_', ' ')}</span>
                                            <span className="font-black text-accent-success">+${r.earning} USDC</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-[10px] text-foreground/20 font-bold mt-4">Earnings are paid out manually in USDC. Contact admin to claim.</p>
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
