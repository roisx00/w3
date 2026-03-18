'use client';

import { useAppContext } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { checkBadgePromo, checkKolBadgePromo } from '@/lib/promos';
import { JobPosting, Airdrop, TalentProfile } from '@/lib/types';
import { Briefcase, Zap, Settings, Award, Clock, ArrowUpRight, Edit3, BadgeCheck, TrendingUp, Lock, Radio, Gift, Copy, Check, LogOut, FileText, PlusCircle, Bot, Users as UsersIcon, Eye, Bookmark, MessageSquare, Shield, Mail, Twitter, Wallet, Megaphone, Rocket, RefreshCw } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import PaymentModal from '@/components/PaymentModal';
import BadgeSuccessModal from '@/components/BadgeSuccessModal';
import KOLBadge from '@/components/KOLBadge';
import { PRICES } from '@/lib/payments';
import Link from 'next/link';

import AuthGuard from '@/components/auth/AuthGuard';
import GoldBadge from '@/components/GoldBadge';

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}

function DashboardContent() {
    const { user, bookmarkedJobs, trackedAirdrops, savedResumes, updateProfile, logReferralEarning, logout, unreadMessagesCount } = useAppContext();
    const { user: privyUser, linkEmail, unlinkEmail, linkTwitter, getAccessToken } = usePrivy();
    const { wallets } = useWallets();
    const [savedJobsData, setSavedJobsData] = useState<JobPosting[]>([]);
    const [trackedAirdropsData, setTrackedAirdropsData] = useState<Airdrop[]>([]);
    const [savedResumesData, setSavedResumesData] = useState<TalentProfile[]>([]);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showBoostModal, setShowBoostModal] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [badgeSuccessType, setBadgeSuccessType] = useState<'kol' | 'resume' | null>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [referralEarnings, setReferralEarnings] = useState<any[]>([]);
    const [referredUsers, setReferredUsers] = useState<any[]>([]);
    const [copiedRef, setCopiedRef] = useState(false);
    const [kolProfile, setKolProfile] = useState<{ hasBadge?: boolean; badgeTxHash?: string; id?: string } | null>(null);
    const [resumeBadgeFree, setResumeBadgeFree] = useState(false);
    const [kolBadgeFree, setKolBadgeFree] = useState(false);
    const [promoLoaded, setPromoLoaded] = useState(false);
    const [migrateLoading, setMigrateLoading] = useState(false);
    const [migrateResult, setMigrateResult] = useState<string | null>(null);

    const referralLink = user?.id
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://w3hub.space'}?ref=${user.id}`
        : '';

    const copyReferralLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
    };

    // Fetch KOL profile badge status
    useEffect(() => {
        if (!user?.id) return;
        getDoc(doc(db, 'kols', user.id)).then(snap => {
            if (snap.exists()) setKolProfile({ id: snap.id, ...snap.data() as any });
        }).catch(() => {});
    }, [user?.id]);

    // Check promo availability (first 50 free)
    useEffect(() => {
        if (!user?.id || promoLoaded) return;
        Promise.all([checkBadgePromo(), checkKolBadgePromo()]).then(([resume, kol]) => {
            setResumeBadgeFree(resume.isFree);
            setKolBadgeFree(kol.isFree);
            setPromoLoaded(true);
        }).catch(() => setPromoLoaded(true));
    }, [user?.id]);

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

    // Fetch referred users
    useEffect(() => {
        if (!user?.id) return;
        getDocs(query(
            collection(db, 'talents'),
            where('referredBy', '==', user.id)
        )).then(snap => {
            setReferredUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

    useEffect(() => {
        async function fetchSavedResumes() {
            if (savedResumes.length > 0) {
                const results = await Promise.all(
                    savedResumes.map(id => getDoc(doc(db, 'talents', id)))
                );
                setSavedResumesData(
                    results.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as TalentProfile))
                );
            } else {
                setSavedResumesData([]);
            }
        }
        fetchSavedResumes();
    }, [savedResumes]);

    // Profile score starts at 80 for new members; completing all 6 fields reaches 100
    const profileFields = [user?.displayName, user?.bio, user?.walletAddress, user?.roles?.length, user?.skills?.length, user?.resumeUrl];
    const profilePct = Math.min(100, 80 + Math.round((profileFields.filter(Boolean).length / profileFields.length) * 20));

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
            setBadgeSuccessType('resume');
        } catch (err) {
            alert('Failed to activate badge. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleFreeBadge = async (type: 'resume' | 'kol') => {
        if (!user?.id || paymentLoading) return;
        setPaymentLoading(true);
        try {
            if (type === 'resume') {
                const token = await getAccessToken();
                const res = await fetch('/api/talents/grant-badge', {
                    method: 'POST',
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to claim badge');
                updateProfile({ hasBadge: true, hasBadgePending: false, badgeTxHash: 'promo-free' } as any);
                setBadgeSuccessType('resume');
            } else {
                const token = await getAccessToken();
                const res = await fetch('/api/kols/claim-free-badge', {
                    method: 'POST',
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to claim badge');
                setKolProfile(prev => prev ? { ...prev, hasBadge: true, badgeTxHash: 'promo-free' } : { id: user.id, hasBadge: true, badgeTxHash: 'promo-free' });
                setBadgeSuccessType('kol');
            }
        } catch (err) {
            alert('Failed to claim badge. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCvBoostPayment = async (txHash: string) => {
        if (!user?.id) return;
        setPaymentLoading(true);
        try {
            const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await addDoc(collection(db, 'payments'), {
                userId: user.id,
                userEmail: user.email || '',
                userDisplayName: user.displayName || '',
                type: 'cv_boost',
                amount: PRICES.CV_BOOST_MONTHLY,
                txHash,
                status: 'verified',
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, 'talents', user.id), { cvBoosted: true, cvBoostExpiry: expiry });
            updateProfile({ cvBoosted: true, cvBoostExpiry: expiry } as any);
            await logReferralEarning('cv_boost', PRICES.CV_BOOST_MONTHLY, txHash, user as any);
            setShowBoostModal(false);
        } catch (err) {
            alert('Failed to activate CV Boost. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleMigrateData = async () => {
        setMigrateLoading(true);
        setMigrateResult(null);
        try {
            const token = await getAccessToken();
            const res = await fetch('/api/migrate-data', {
                method: 'POST',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            });
            const data = await res.json();
            if (!res.ok) {
                setMigrateResult(data.error || 'Migration failed.');
            } else if (!data.found) {
                setMigrateResult('No previous account found with your email.');
            } else if (data.merged === 0) {
                setMigrateResult('Your profile already has all your previous data.');
            } else {
                setMigrateResult(`Restored ${data.merged} field(s): ${data.fields?.join(', ')}. Refresh to see updates.`);
            }
        } catch {
            setMigrateResult('Something went wrong. Try again.');
        } finally {
            setMigrateLoading(false);
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
                        <h3 className="font-display font-black text-xl mb-1 flex items-center justify-center gap-1.5">
                            {user?.displayName || 'Anonymous'}
                            {kolProfile?.hasBadge
                                ? <KOLBadge size={22} className="drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
                                : user?.hasBadge
                                    ? <GoldBadge size={22} className="drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                                    : null}
                        </h3>
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
                        <Link href="/dashboard/messages" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm group">
                            <span className="flex items-center gap-3">
                                <MessageSquare className="w-4 h-4" /> Messages
                            </span>
                            {unreadMessagesCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center animate-in zoom-in duration-300">
                                    <span className="text-[10px] font-black text-black">{unreadMessagesCount}</span>
                                </span>
                            )}
                        </Link>
                        <Link href={`/talents/${user?.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <FileText className="w-4 h-4" /> My Resume
                        </Link>
                        <Link href="/onboarding" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <Edit3 className="w-4 h-4" /> Edit Resume
                        </Link>
                        {kolProfile && (
                            <Link href={`/kols/${encodeURIComponent(user?.id || '')}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                                <Megaphone className="w-4 h-4" /> My KOL Profile
                            </Link>
                        )}
                        <Link href="/kols/register" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <Settings className="w-4 h-4" /> {kolProfile ? 'Edit KOL Profile' : 'Create KOL Profile'}
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

                    {/* Account Security */}
                    <div className="glass p-5 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Account Security
                        </p>

                        {/* X / Twitter */}
                        {(() => {
                            const twitterAccount = privyUser?.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth') as any;
                            return twitterAccount ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground/70">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                                        @{twitterAccount.username}
                                    </div>
                                    <button onClick={() => linkTwitter()} className="text-[10px] font-black text-foreground/30 hover:text-accent-primary transition-colors uppercase tracking-widest">Change</button>
                                </div>
                            ) : (
                                <button onClick={() => linkTwitter()} className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-foreground/50 hover:border-accent-primary/30 transition-colors">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                                        Link X Account
                                    </span>
                                    <span className="text-accent-primary">+</span>
                                </button>
                            );
                        })()}

                        {/* Email backup */}
                        {(() => {
                            const emailAccount = privyUser?.linkedAccounts?.find((a: any) => a.type === 'email') as any;
                            return emailAccount ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground/70">
                                        <Mail className="w-3.5 h-3.5" />
                                        {emailAccount.address}
                                    </div>
                                    <button onClick={() => unlinkEmail(emailAccount.address)} className="text-[10px] font-black text-foreground/30 hover:text-accent-danger transition-colors uppercase tracking-widest">Remove</button>
                                </div>
                            ) : (
                                <button onClick={() => linkEmail()} className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-foreground/50 hover:border-accent-primary/30 transition-colors">
                                    <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Add Email Backup</span>
                                    <span className="text-accent-primary">+</span>
                                </button>
                            );
                        })()}

                        {/* Restore previous account (Firebase → Privy migration) */}
                        <div className="pt-2 border-t border-white/5">
                            {privyUser?.linkedAccounts?.some((a: any) => a.type === 'email') ? (
                                <>
                                    <button
                                        onClick={handleMigrateData}
                                        disabled={migrateLoading}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-foreground/50 hover:border-accent-primary/30 hover:text-foreground/70 transition-colors disabled:opacity-50"
                                    >
                                        <span className="flex items-center gap-2">
                                            <RefreshCw className={`w-3.5 h-3.5 ${migrateLoading ? 'animate-spin' : ''}`} />
                                            {migrateLoading ? 'Restoring...' : 'Restore Previous Account Data'}
                                        </span>
                                    </button>
                                    {migrateResult && (
                                        <p className="text-[10px] text-foreground/50 mt-1.5 px-1 leading-relaxed">{migrateResult}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-[10px] text-foreground/40 px-1 leading-relaxed">
                                    Had an account before? Add your old email above (Add Email Backup) then a &quot;Restore Previous Account Data&quot; button will appear.
                                </p>
                            )}
                        </div>

                        {/* Wallet */}
                        {(() => {
                            const embedded = wallets.find((w: any) => w.walletClientType === 'privy');
                            return embedded ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-foreground/50">
                                    <Wallet className="w-3.5 h-3.5 text-accent-success" />
                                    <span className="font-mono">{embedded.address.slice(0, 6)}...{embedded.address.slice(-4)}</span>
                                    <span className="text-[9px] text-accent-success uppercase tracking-widest font-black">Auto</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-foreground/30">
                                    <Wallet className="w-3.5 h-3.5" /> Wallet generating...
                                </div>
                            );
                        })()}
                    </div>

                    {/* Access & Boosts */}
                    <div className="glass p-5 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-3">Access & Boosts</p>

                        {/* Resume Badge row */}
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${user?.hasBadge ? 'bg-amber-500/8 border-amber-500/20' : 'bg-white/3 border-white/8'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${user?.hasBadge ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                                <BadgeCheck className={`w-3.5 h-3.5 ${user?.hasBadge ? 'text-amber-400' : 'text-foreground/30'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-black uppercase tracking-wide leading-none ${user?.hasBadge ? 'text-amber-400' : 'text-foreground/50'}`}>Resume Badge</p>
                                <p className="text-[9px] text-foreground/25 font-medium mt-0.5">
                                    {user?.hasBadge ? 'Active' : user?.hasBadgePending ? 'Pending…' : resumeBadgeFree ? '🎁 FREE · launch promo' : `$${PRICES.USER_BADGE} USDC · one-time`}
                                </p>
                            </div>
                            {user?.hasBadge ? (
                                <Check className="w-3.5 h-3.5 text-accent-success shrink-0" />
                            ) : user?.hasBadgePending ? (
                                <Clock className="w-3.5 h-3.5 text-accent-warning shrink-0" />
                            ) : resumeBadgeFree ? (
                                <button onClick={() => handleFreeBadge('resume')} disabled={paymentLoading}
                                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all shrink-0 disabled:opacity-50">
                                    {paymentLoading ? '…' : 'FREE'}
                                </button>
                            ) : (
                                <button onClick={() => setShowBadgeModal(true)} disabled={paymentLoading}
                                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-lg hover:bg-amber-500/25 transition-all shrink-0 disabled:opacity-50">
                                    Get
                                </button>
                            )}
                        </div>

                        {/* CV Boost row */}
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${user?.cvBoosted ? 'bg-accent-secondary/8 border-accent-secondary/20' : 'bg-white/3 border-white/8'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${user?.cvBoosted ? 'bg-accent-secondary/20' : 'bg-white/5'}`}>
                                <TrendingUp className={`w-3.5 h-3.5 ${user?.cvBoosted ? 'text-accent-secondary' : 'text-foreground/30'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-black uppercase tracking-wide leading-none ${user?.cvBoosted ? 'text-accent-secondary' : 'text-foreground/50'}`}>CV Boost</p>
                                <p className="text-[9px] text-foreground/25 font-medium mt-0.5">
                                    {user?.cvBoosted ? (user?.cvBoostExpiry ? `Until ${new Date(user.cvBoostExpiry).toLocaleDateString()}` : 'Active') : `$${PRICES.CV_BOOST_MONTHLY} USDC/mo`}
                                </p>
                            </div>
                            {user?.cvBoosted ? (
                                <Check className="w-3.5 h-3.5 text-accent-success shrink-0" />
                            ) : (
                                <button onClick={() => setShowBoostModal(true)}
                                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-accent-secondary/15 border border-accent-secondary/25 text-accent-secondary rounded-lg hover:bg-accent-secondary/25 transition-all shrink-0">
                                    Boost
                                </button>
                            )}
                        </div>

                        <div className="pt-1 pb-0.5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">KOL Hub</p>
                        </div>

                        {/* KOL Badge row */}
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${kolProfile?.hasBadge ? 'bg-purple-500/8 border-purple-500/20' : 'bg-white/3 border-white/8'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${kolProfile?.hasBadge ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                                <BadgeCheck className={`w-3.5 h-3.5 ${kolProfile?.hasBadge ? 'text-purple-400' : 'text-foreground/30'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-black uppercase tracking-wide leading-none ${kolProfile?.hasBadge ? 'text-purple-400' : 'text-foreground/50'}`}>KOL Badge</p>
                                <p className="text-[9px] text-foreground/25 font-medium mt-0.5">
                                    {kolProfile?.hasBadge ? 'Verified' : !kolProfile ? 'Setup KOL profile first' : kolBadgeFree ? '🎁 FREE · launch promo' : `$${PRICES.KOL_BADGE} USDC · one-time`}
                                </p>
                            </div>
                            {kolProfile?.hasBadge ? (
                                <Check className="w-3.5 h-3.5 text-accent-success shrink-0" />
                            ) : !kolProfile ? (
                                <Link href="/kols/register"
                                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-purple-500/15 border border-purple-500/25 text-purple-400 rounded-lg hover:bg-purple-500/25 transition-all shrink-0">
                                    Setup
                                </Link>
                            ) : kolBadgeFree ? (
                                <button onClick={() => handleFreeBadge('kol')} disabled={paymentLoading}
                                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all shrink-0 disabled:opacity-50">
                                    {paymentLoading ? '…' : 'FREE'}
                                </button>
                            ) : (
                                <Link href={`/kols/${encodeURIComponent(user?.id || '')}`}
                                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-purple-500/15 border border-purple-500/25 text-purple-400 rounded-lg hover:bg-purple-500/25 transition-all shrink-0">
                                    Get
                                </Link>
                            )}
                        </div>

                        {/* KOL Boost row */}
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white/3 border-white/8 transition-all">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                                <Rocket className="w-3.5 h-3.5 text-foreground/30" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wide leading-none text-foreground/50">KOL Boost</p>
                                <p className="text-[9px] text-foreground/25 font-medium mt-0.5">${PRICES.KOL_BOOST_MONTHLY} USDC/mo</p>
                            </div>
                            <Link href={kolProfile ? `/kols/${encodeURIComponent(user?.id || '')}` : '/kols/register'}
                                className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-white/8 border border-white/10 text-foreground/40 rounded-lg hover:border-white/20 transition-all shrink-0">
                                Boost
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-3 space-y-12">
                    {/* Badge Status — Both Badges */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Resume Badge */}
                        <div className={`glass p-5 border transition-all ${user?.hasBadge ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10 hover:border-amber-500/20'}`}>
                            {/* Badge Visual — Gold scalloped seal */}
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <svg width="108" height="108" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
                                        className={user?.hasBadge ? 'drop-shadow-[0_0_22px_rgba(234,179,8,0.75)]' : ''}>
                                        <defs>
                                            <linearGradient id="w3h-rb-grad" x1="30%" y1="5%" x2="70%" y2="95%">
                                                <stop offset="0%" stopColor={user?.hasBadge ? "#FFE066" : "#b8860b"} />
                                                <stop offset="100%" stopColor={user?.hasBadge ? "#B45309" : "#7a5500"} />
                                            </linearGradient>
                                        </defs>
                                        {/* 8-bump smooth scalloped badge */}
                                        <path d="M50 6 C55.78 6 59.94 13.98 64.55 14.89 C69.16 16.80 77.03 14.81 81.11 18.89 C85.19 22.97 83.20 30.84 85.11 35.45 C87.02 40.06 94 44.22 94 50 C94 55.78 87.02 59.94 85.11 64.55 C83.20 69.16 85.19 77.03 81.11 81.11 C77.03 85.19 69.16 83.20 64.55 85.11 C59.94 87.02 55.78 94 50 94 C44.22 94 40.06 87.02 35.45 85.11 C30.84 83.20 22.97 85.19 18.89 81.11 C14.81 77.03 16.80 69.16 14.89 64.55 C12.98 59.94 6 55.78 6 50 C6 44.22 12.98 40.06 14.89 35.45 C16.80 30.84 14.81 22.97 18.89 18.89 C22.97 14.81 30.84 16.80 35.45 14.89 C40.06 12.98 44.22 6 50 6 Z"
                                            fill="url(#w3h-rb-grad)" />
                                        {/* Checkmark */}
                                        <path d="M31 50L43 63L69 36" stroke="white" strokeOpacity={user?.hasBadge ? 1 : 0.55} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </svg>
                                    {user?.hasBadge && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center mb-3">
                                <p className="font-black text-sm uppercase tracking-tight">Resume Badge</p>
                                {user?.hasBadge
                                    ? <p className="text-[10px] text-amber-400 font-bold">Verified · Active</p>
                                    : user?.hasBadgePending
                                        ? <p className="text-[10px] text-accent-warning font-bold">Pending verification</p>
                                        : <p className="text-[10px] text-foreground/40 font-medium">Not yet purchased</p>}
                            </div>
                            <ul className="space-y-1 mb-4">
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${user?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user?.hasBadge ? 'bg-amber-400' : 'bg-white/20'}`} />
                                    Pins your resume to the top of Talents
                                </li>
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${user?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user?.hasBadge ? 'bg-amber-400' : 'bg-white/20'}`} />
                                    Upload &amp; share your Web3 resume PDF
                                </li>
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${user?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user?.hasBadge ? 'bg-amber-400' : 'bg-white/20'}`} />
                                    Unlocks airdrop task tracking
                                </li>
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${user?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user?.hasBadge ? 'bg-amber-400' : 'bg-white/20'}`} />
                                    Gold badge shown on your profile
                                </li>
                            </ul>
                            {user?.hasBadge ? (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <BadgeCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Badge Active</span>
                                    </div>
                                    {(user as any)?.badgeTxHash && (
                                        <a href={`https://basescan.org/tx/${(user as any).badgeTxHash}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[9px] text-foreground/30 hover:text-amber-400 font-bold transition-colors px-1">
                                            <ArrowUpRight className="w-2.5 h-2.5" /> View on BaseScan
                                        </a>
                                    )}
                                </div>
                            ) : user?.hasBadgePending ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-accent-warning/10 border border-accent-warning/20 rounded-xl">
                                    <Clock className="w-3.5 h-3.5 text-accent-warning shrink-0" />
                                    <span className="text-[10px] font-black text-accent-warning uppercase tracking-widest">Pending Review</span>
                                </div>
                            ) : (
                                <button onClick={() => setShowBadgeModal(true)} disabled={paymentLoading}
                                    className="w-full flex items-center justify-between px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500/20 transition-all disabled:opacity-50">
                                    <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Get Resume Badge</span>
                                    <span>${PRICES.USER_BADGE} USDC</span>
                                </button>
                            )}
                        </div>

                        {/* KOL Badge */}
                        <div className={`glass p-5 border transition-all ${kolProfile?.hasBadge ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/20'}`}>
                            {/* Badge Visual */}
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <svg width="108" height="108" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
                                        className={kolProfile?.hasBadge ? 'drop-shadow-[0_0_22px_rgba(239,68,68,0.75)]' : ''}>
                                        <defs>
                                            <linearGradient id="w3h-kol-grad" x1="20%" y1="0%" x2="80%" y2="100%">
                                                <stop offset="0%" stopColor={kolProfile?.hasBadge ? "#FF4D4D" : "#991b1b"} />
                                                <stop offset="50%" stopColor={kolProfile?.hasBadge ? "#DC2626" : "#7f1d1d"} />
                                                <stop offset="100%" stopColor={kolProfile?.hasBadge ? "#7F1D1D" : "#450a0a"} />
                                            </linearGradient>
                                        </defs>
                                        {/* Shadow layer (active only) */}
                                        {kolProfile?.hasBadge && (
                                            <path d="M50 6 C54.62 6 57.53 14.59 61.12 15.76 C64.71 16.93 72.13 11.68 75.87 14.40 C79.61 17.12 76.90 25.77 79.12 28.83 C81.34 31.89 90.41 32.01 91.84 36.40 C93.27 40.79 86 46.22 86 50 C86 53.78 93.27 59.21 91.84 63.60 C90.41 67.99 81.34 68.11 79.12 71.17 C76.90 74.23 79.61 82.88 75.87 85.60 C72.13 88.32 64.71 83.07 61.12 84.24 C57.53 85.41 54.62 94 50 94 C45.38 94 42.47 85.41 38.88 84.24 C35.29 83.07 27.87 88.32 24.13 85.60 C20.39 82.88 23.10 74.23 20.88 71.17 C18.66 68.11 8.16 67.99 6.73 63.60 C5.30 59.21 14 53.78 14 50 C14 46.22 5.30 40.79 6.73 36.40 C8.16 32.01 18.66 31.89 20.88 28.83 C23.10 25.77 20.39 17.12 24.13 14.40 C27.87 11.68 35.29 16.93 38.88 15.76 C42.47 14.59 45.38 6 50 6 Z"
                                                fill="#3b0000" transform="translate(2.5,3.5)" opacity="0.45" />
                                        )}
                                        {/* 10-bump wavy seal */}
                                        <path d="M50 6 C54.62 6 57.53 14.59 61.12 15.76 C64.71 16.93 72.13 11.68 75.87 14.40 C79.61 17.12 76.90 25.77 79.12 28.83 C81.34 31.89 90.41 32.01 91.84 36.40 C93.27 40.79 86 46.22 86 50 C86 53.78 93.27 59.21 91.84 63.60 C90.41 67.99 81.34 68.11 79.12 71.17 C76.90 74.23 79.61 82.88 75.87 85.60 C72.13 88.32 64.71 83.07 61.12 84.24 C57.53 85.41 54.62 94 50 94 C45.38 94 42.47 85.41 38.88 84.24 C35.29 83.07 27.87 88.32 24.13 85.60 C20.39 82.88 23.10 74.23 20.88 71.17 C18.66 68.11 8.16 67.99 6.73 63.60 C5.30 59.21 14 53.78 14 50 C14 46.22 5.30 40.79 6.73 36.40 C8.16 32.01 18.66 31.89 20.88 28.83 C23.10 25.77 20.39 17.12 24.13 14.40 C27.87 11.68 35.29 16.93 38.88 15.76 C42.47 14.59 45.38 6 50 6 Z"
                                            fill="url(#w3h-kol-grad)" />
                                        {/* Bold checkmark */}
                                        <path d="M28 51L41 65L72 32" stroke="white" strokeOpacity={kolProfile?.hasBadge ? 1 : 0.5} strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </svg>
                                    {kolProfile?.hasBadge && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center mb-3">
                                <p className="font-black text-sm uppercase tracking-tight">KOL Badge</p>
                                {kolProfile?.hasBadge
                                    ? <p className="text-[10px] text-purple-400 font-bold">Verified KOL · Active</p>
                                    : kolProfile
                                        ? <p className="text-[10px] text-foreground/40 font-medium">Profile exists · Badge not purchased</p>
                                        : <p className="text-[10px] text-foreground/40 font-medium">No KOL profile yet</p>}
                            </div>
                            <ul className="space-y-1 mb-4">
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${kolProfile?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${kolProfile?.hasBadge ? 'bg-purple-400' : 'bg-white/20'}`} />
                                    Verified KOL — projects find &amp; trust you
                                </li>
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${kolProfile?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${kolProfile?.hasBadge ? 'bg-purple-400' : 'bg-white/20'}`} />
                                    Pins your KOL profile to top of Hub
                                </li>
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${kolProfile?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${kolProfile?.hasBadge ? 'bg-purple-400' : 'bg-white/20'}`} />
                                    Projects can leave on-chain feedback
                                </li>
                                <li className={`text-[10px] font-medium flex items-center gap-1.5 ${kolProfile?.hasBadge ? 'text-foreground/60' : 'text-foreground/30'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${kolProfile?.hasBadge ? 'bg-purple-400' : 'bg-white/20'}`} />
                                    Collaboration proofs linked on-chain
                                </li>
                            </ul>
                            {kolProfile?.hasBadge ? (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                        <BadgeCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">KOL Badge Active</span>
                                    </div>
                                    {kolProfile.badgeTxHash && (
                                        <a href={`https://basescan.org/tx/${kolProfile.badgeTxHash}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[9px] text-foreground/30 hover:text-purple-400 font-bold transition-colors px-1">
                                            <ArrowUpRight className="w-2.5 h-2.5" /> View on BaseScan
                                        </a>
                                    )}
                                </div>
                            ) : kolProfile ? (
                                <Link href="/kols/register"
                                    className="w-full flex items-center justify-between px-3 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-500/20 transition-all">
                                    <span className="flex items-center gap-2"><BadgeCheck className="w-3 h-3" /> Get KOL Badge</span>
                                    <span>${PRICES.KOL_BADGE} USDC</span>
                                </Link>
                            ) : (
                                <Link href="/kols/register"
                                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 text-foreground/40 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-purple-500/20 hover:text-purple-400 transition-all">
                                    <span className="flex items-center gap-2"><Megaphone className="w-3 h-3" /> Create KOL Profile First</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </section>

                    {/* My Profiles */}
                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-4">My Profiles</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Talent Resume Card */}
                            <div className="glass p-5 border border-white/5 hover:border-accent-primary/30 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-accent-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-sm uppercase tracking-tight">Web3 Resume</p>
                                        <p className="text-[10px] text-foreground/40 font-medium">Talent profile · {profilePct}% complete</p>
                                    </div>
                                    {user?.hasBadge && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full mb-4">
                                    <div className="h-full bg-accent-primary rounded-full transition-all" style={{ width: `${profilePct}%` }} />
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <Link href={`/talents/${user?.id}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-foreground/60 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-accent-primary/30 hover:text-accent-primary transition-all">
                                        <Eye className="w-3 h-3" /> View
                                    </Link>
                                    <Link href="/onboarding"
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-all">
                                        <Edit3 className="w-3 h-3" /> Edit
                                    </Link>
                                </div>
                                <button
                                    onClick={() => updateProfile({ openToWork: !user?.openToWork } as any)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user?.openToWork
                                        ? 'bg-accent-success/10 border border-accent-success/30 text-accent-success'
                                        : 'bg-white/5 border border-white/10 text-foreground/40 hover:border-white/20'}`}
                                >
                                    <span className="flex items-center gap-2"><Radio className="w-3 h-3" />{user?.openToWork ? 'Open to Work' : 'Not Looking'}</span>
                                    <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${user?.openToWork ? 'bg-accent-success' : 'bg-white/10'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${user?.openToWork ? 'left-4' : 'left-0.5'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* KOL Profile Card */}
                            {kolProfile ? (
                                <div className="glass p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all bg-amber-500/3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                            <Megaphone className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-sm uppercase tracking-tight">KOL Profile</p>
                                            <p className="text-[10px] text-foreground/40 font-medium">
                                                {kolProfile.hasBadge ? 'KOL Verified' : 'Badge not yet purchased'}
                                            </p>
                                        </div>
                                        {kolProfile.hasBadge && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                                    </div>
                                    <div className="flex gap-2 mb-3">
                                        <Link href={`/kols/${encodeURIComponent(user?.id || '')}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-foreground/60 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-amber-500/30 hover:text-amber-400 transition-all">
                                            <Eye className="w-3 h-3" /> View
                                        </Link>
                                        <Link href="/kols/register"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500/20 transition-all">
                                            <Edit3 className="w-3 h-3" /> Edit
                                        </Link>
                                    </div>
                                    <button
                                        onClick={async () => { const token = await getAccessToken(); fetch('/api/kols/save', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ userId: user?.id, data: { openToCollabs: !(kolProfile as any).openToCollabs } }) }).then(() => setKolProfile(p => p ? { ...p, openToCollabs: !(p as any).openToCollabs } as any : p)); }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${(kolProfile as any).openToCollabs
                                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                            : 'bg-white/5 border border-white/10 text-foreground/40 hover:border-white/20'}`}
                                    >
                                        <span className="flex items-center gap-2"><Megaphone className="w-3 h-3" />{(kolProfile as any).openToCollabs ? 'Open to Collabs' : 'Not Available'}</span>
                                        <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${(kolProfile as any).openToCollabs ? 'bg-amber-500' : 'bg-white/10'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${(kolProfile as any).openToCollabs ? 'left-4' : 'left-0.5'}`} />
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <Link href="/kols/register"
                                    className="glass p-5 border border-dashed border-white/10 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-3 text-center group">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
                                        <Megaphone className="w-5 h-5 text-amber-400/50 group-hover:text-amber-400 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-tight text-foreground/40 group-hover:text-foreground/70 transition-colors">Create KOL Profile</p>
                                        <p className="text-[10px] text-foreground/20 mt-0.5">Showcase your reach to projects</p>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </section>

                    {/* Quick Actions */}
                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-4">Quick Actions</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Link href="/airdrops" className="group glass p-4 hover:border-accent-success/40 transition-all flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-accent-success/10 border border-accent-success/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <Gift className="w-4 h-4 text-accent-success" />
                                </div>
                                <div>
                                    <p className="font-black text-xs uppercase tracking-tight">Airdrops</p>
                                    <p className="text-[10px] text-foreground/30">Track alpha</p>
                                </div>
                            </Link>
                            <Link href="/jobs" className="group glass p-4 hover:border-accent-primary/40 transition-all flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <Briefcase className="w-4 h-4 text-accent-primary" />
                                </div>
                                <div>
                                    <p className="font-black text-xs uppercase tracking-tight">Jobs</p>
                                    <p className="text-[10px] text-foreground/30">Find roles</p>
                                </div>
                            </Link>
                            <Link href="/jobs/new" className="group glass p-4 hover:border-accent-secondary/40 transition-all flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <PlusCircle className="w-4 h-4 text-accent-secondary" />
                                </div>
                                <div>
                                    <p className="font-black text-xs uppercase tracking-tight">Post Job</p>
                                    <p className="text-[10px] text-foreground/30">Hire talent</p>
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

                        {user?.roles?.includes('Founder') && (
                            <section className="md:col-span-2">
                                <h4 className="font-display font-black text-xl mb-6 flex items-center gap-3">
                                    Saved Resumes
                                    <span className="px-2 py-0.5 bg-accent-secondary/10 text-accent-secondary text-[10px] rounded font-black">{savedResumesData.length}</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {savedResumesData.length > 0 ? savedResumesData.map(talent => (
                                        <Link key={talent.id} href={`/talents/${talent.id}`} className="glass p-4 group hover:border-accent-secondary/30 transition-colors flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 flex items-center justify-center font-bold text-accent-secondary text-sm overflow-hidden shrink-0">
                                                {talent.photoUrl 
                                                    ? <img src={talent.photoUrl} alt="" className="w-full h-full object-cover" />
                                                    : talent.displayName?.charAt(0)
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-bold text-sm leading-none flex items-center gap-1.5">
                                                    {talent.displayName}
                                                </h5>
                                                <p className="text-[10px] text-foreground/40 mt-1 uppercase tracking-widest font-bold">@{talent.username}</p>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-foreground/20 group-hover:text-accent-secondary transition-colors" />
                                        </Link>
                                    )) : (
                                        <div className="col-span-full py-10 glass border-dashed border-white/5 flex flex-col items-center justify-center gap-3 text-foreground/20 italic text-sm">
                                            <Bookmark className="w-8 h-8 opacity-20" />
                                            No resumes saved yet.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

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

                            {/* Earnings & Referrals */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="glass p-4 text-center">
                                    <p className="text-2xl font-black text-accent-success">{referredUsers.length}</p>
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Referrals</p>
                                </div>
                                <div className="glass p-4 text-center">
                                    <p className="text-2xl font-black text-accent-success">
                                        ${referralEarnings.reduce((sum, r) => sum + (r.earning || 0), 0).toFixed(2)}
                                    </p>
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">USDC Earned</p>
                                </div>
                            </div>

                            {referredUsers.length > 0 && (
                                <div className="mt-8 mb-6">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Your Referrals</h5>
                                    <div className="space-y-2">
                                        {referredUsers.map((u: any) => (
                                            <div key={u.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-accent-primary/20 flex items-center justify-center font-bold text-[8px] text-accent-primary tracking-tighter uppercase overflow-hidden shrink-0">
                                                        {u.photoUrl ? <img src={u.photoUrl} alt="" className="w-full h-full object-cover" /> : (u.displayName || 'U').charAt(0)}
                                                    </div>
                                                    <span className="text-foreground/80 font-bold">{u.displayName || 'Anonymous'}</span>
                                                </div>
                                                <span className="text-[10px] text-foreground/40">@{u.username || 'user'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {referralEarnings.length > 0 && (
                                <div className="mt-8">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Earnings History</h5>
                                    <div className="space-y-2">
                                        {referralEarnings.slice(0, 5).map((r: any) => (
                                            <div key={r.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white/5 rounded-lg">
                                                <span className="text-foreground/60">{r.refereeName} · {r.paymentType.replace('_', ' ')}</span>
                                                <span className="font-black text-accent-success">+${r.earning} USDC</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
            <BadgeSuccessModal
                isOpen={badgeSuccessType !== null}
                type={badgeSuccessType ?? 'resume'}
                onClose={() => setBadgeSuccessType(null)}
            />
        </div>
    );
}
