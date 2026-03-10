'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, addDoc, serverTimestamp
} from 'firebase/firestore';
import { JobPosting, Airdrop, TalentProfile, PaymentRecord } from '@/lib/types';
import {
    LayoutDashboard,
    Briefcase,
    Sparkles,
    Users,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    RefreshCw,
    Search,
    Star,
    CreditCard,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Clock,
    Plus,
    X,
    ImagePlus,
    List
} from 'lucide-react';
import { PAYMENT_LABELS, BASE_EXPLORER_TX } from '@/lib/payments';

type Tab = 'jobs' | 'airdrops' | 'users' | 'payments';

export default function AdminDashboard() {
    const { user, isLoggedIn, authLoading } = useAppContext();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('payments');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
    const [talents, setTalents] = useState<TalentProfile[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [showAirdropForm, setShowAirdropForm] = useState(false);
    const [airdropFormSubmitting, setAirdropFormSubmitting] = useState(false);
    const [uploadingAdminLogo, setUploadingAdminLogo] = useState(false);
    const [adminAirdropForm, setAdminAirdropForm] = useState({
        projectName: '', website: '', twitter: '', logoUrl: '',
        blockchain: '', difficulty: 'Medium', status: 'Live' as 'Live' | 'Upcoming' | 'Ended',
        type: 'Confirmed' as 'Confirmed' | 'Potential',
        fundingAmount: '', potentialReward: '', description: '',
        tasks: [''] as string[],
    });

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/');
        }
    }, [authLoading, isLoggedIn, router]);

    const fetchData = async () => {
        const isOwner = user?.id === process.env.NEXT_PUBLIC_ADMIN_UID || user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        if (!user?.isAdmin && !isOwner) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [jobsSnap, airdropsSnap, paymentsSnap] = await Promise.all([
                getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc'))),
                getDocs(query(collection(db, 'airdrops'), orderBy('createdAt', 'desc'))),
                getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc'))),
            ]);
            // talents may not have updatedAt on all docs — fallback to unordered
            let talentsSnap;
            try {
                talentsSnap = await getDocs(query(collection(db, 'talents'), orderBy('updatedAt', 'desc')));
            } catch {
                talentsSnap = await getDocs(collection(db, 'talents'));
            }

            setJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as JobPosting)));
            setAirdrops(airdropsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Airdrop)));
            setTalents(talentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TalentProfile)));
            setPayments(paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord)));
        } catch (err: any) {
            console.error("Error fetching admin data:", err);
            setError(err.message || "Failed to fetch data. Check your Firestore permissions and indexes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchData();
    }, [authLoading, user?.id]);

    const handleDelete = async (coll: string, id: string) => {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        try {
            await deleteDoc(doc(db, coll, id));
            fetchData();
        } catch (err) {
            alert('Failed to delete item.');
        }
    };

    const handleFeature = async (coll: string, id: string, currentFeatured: boolean) => {
        try {
            await updateDoc(doc(db, coll, id), { featured: !currentFeatured });
            fetchData();
        } catch (err) {
            alert('Failed to update featured status.');
        }
    };

    const handleVerify = async (id: string, currentVerified: boolean) => {
        try {
            await updateDoc(doc(db, 'jobs', id), { verified: !currentVerified });
            fetchData();
        } catch (err) {
            alert('Failed to update verified status.');
        }
    };

    const handleVerifyPayment = async (payment: PaymentRecord) => {
        try {
            switch (payment.type) {
                case 'job_post':
                    if (payment.refId) {
                        await updateDoc(doc(db, 'jobs', payment.refId), { paymentStatus: 'verified' });
                    }
                    break;
                case 'airdrop_post':
                    if (payment.refId) {
                        await updateDoc(doc(db, 'airdrops', payment.refId), { paymentStatus: 'verified' });
                    }
                    break;
                case 'user_badge':
                    await updateDoc(doc(db, 'talents', payment.userId), { hasBadge: true, hasBadgePending: false });
                    break;
                case 'cv_boost': {
                    const expiry = new Date();
                    expiry.setDate(expiry.getDate() + 30);
                    await updateDoc(doc(db, 'talents', payment.userId), {
                        cvBoosted: true,
                        cvBoostExpiry: expiry.toISOString(),
                    });
                    break;
                }
                case 'job_boost': {
                    if (payment.refId) {
                        const expiry = new Date();
                        expiry.setDate(expiry.getDate() + 30);
                        await updateDoc(doc(db, 'jobs', payment.refId), {
                            boosted: true,
                            featured: true,
                            boostExpiry: expiry.toISOString(),
                        });
                    }
                    break;
                }
            }
            await updateDoc(doc(db, 'payments', payment.id), { status: 'verified' });
            fetchData();
        } catch (err) {
            alert('Failed to verify payment.');
        }
    };

    const handleRejectPayment = async (paymentId: string) => {
        if (!window.confirm('Reject this payment?')) return;
        try {
            await updateDoc(doc(db, 'payments', paymentId), { status: 'rejected' });
            fetchData();
        } catch (err) {
            alert('Failed to reject payment.');
        }
    };

    const filteredJobs = jobs.filter(j =>
        !search ||
        j.roleNeeded?.toLowerCase().includes(search.toLowerCase()) ||
        j.projectName?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredAirdrops = airdrops.filter(a =>
        !search ||
        a.projectName?.toLowerCase().includes(search.toLowerCase()) ||
        a.blockchain?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredTalents = talents.filter(t =>
        !search ||
        t.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        t.username?.toLowerCase().includes(search.toLowerCase()) ||
        t.roles?.some(r => r.toLowerCase().includes(search.toLowerCase()))
    );
    const filteredPayments = payments.filter(p =>
        !search ||
        p.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        p.userDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
        p.refName?.toLowerCase().includes(search.toLowerCase()) ||
        p.type?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdminLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAdminLogo(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const { url } = await res.json();
            setAdminAirdropForm(p => ({ ...p, logoUrl: url }));
        } catch { alert('Upload failed.'); }
        finally { setUploadingAdminLogo(false); e.target.value = ''; }
    };

    const handleAdminPostAirdrop = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAirdropFormSubmitting(true);
        try {
            await addDoc(collection(db, 'airdrops'), {
                ...adminAirdropForm,
                tasks: adminAirdropForm.tasks.filter(t => t.trim()),
                submittedBy: user?.id,
                participationCount: '0',
                paymentStatus: 'verified',
                isAdminPost: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setShowAirdropForm(false);
            setAdminAirdropForm({ projectName: '', website: '', twitter: '', logoUrl: '', blockchain: '', difficulty: 'Medium', status: 'Live', type: 'Confirmed', fundingAmount: '', potentialReward: '', description: '', tasks: [''] });
            fetchData();
        } catch { alert('Failed to post airdrop.'); }
        finally { setAirdropFormSubmitting(false); }
    };

    const pendingCount = payments.filter(p => p.status === 'pending').length;

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-accent-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Syncing Command Center...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-6">
                <ShieldAlert className="w-16 h-16 text-accent-danger mx-auto" />
                <h1 className="text-3xl font-black uppercase">System Error</h1>
                <p className="text-foreground/40 font-medium">{error}</p>
                <button
                    onClick={fetchData}
                    className="glass-pill px-8 py-3 bg-accent-primary text-white font-bold uppercase text-xs"
                >
                    Retry Connection
                </button>
            </div>
        </div>
    );

    if (!user?.isAdmin && user?.id !== '8QlMg7xGGrWeJKW6WnEUF5OQUb53' && user?.email !== 'roisx00@gmail.com') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6 bg-white/5 p-12 rounded-[2rem] border border-white/10 shadow-2xl">
                    <ShieldAlert className="w-16 h-16 text-accent-danger mx-auto animate-pulse" />
                    <h1 className="text-3xl font-black uppercase">Access Denied</h1>
                    <p className="text-foreground/60 font-medium">This terminal is restricted to authorized administrators only.</p>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="text-left space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary">How to unlock:</p>
                        <ol className="text-xs text-foreground/40 space-y-2 list-decimal list-inside font-bold">
                            <li>Open Firebase Console (Firestore)</li>
                            <li>Go to 'talents' collection</li>
                            <li>Find your document</li>
                            <li>Add field: <code className="text-accent-primary">isAdmin: true</code> (boolean)</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    const activeCount = activeTab === 'jobs' ? filteredJobs.length
        : activeTab === 'airdrops' ? filteredAirdrops.length
            : activeTab === 'users' ? filteredTalents.length
                : filteredPayments.length;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 text-accent-primary mb-2">
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Command Center</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter">Admin <span className="text-accent-primary">Dashboard</span></h1>
                </div>

                <div className="flex flex-wrap gap-2 glass p-1 rounded-2xl">
                    <button
                        onClick={() => { setActiveTab('payments'); setSearch(''); }}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'bg-foreground text-background' : 'hover:bg-white/5'}`}
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Payments
                        {pendingCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-accent-warning text-background text-[9px] font-black flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab('jobs'); setSearch(''); }}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'jobs' ? 'bg-foreground text-background' : 'hover:bg-white/5'}`}
                    >
                        Jobs ({jobs.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('airdrops'); setSearch(''); }}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'airdrops' ? 'bg-foreground text-background' : 'hover:bg-white/5'}`}
                    >
                        Airdrops ({airdrops.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('users'); setSearch(''); }}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-foreground text-background' : 'hover:bg-white/5'}`}
                    >
                        Users ({talents.length})
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass p-5 border-accent-warning/20 bg-accent-warning/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-warning mb-1">Pending</p>
                    <p className="text-3xl font-black text-accent-warning">{pendingCount}</p>
                    <p className="text-[10px] text-foreground/30 font-bold mt-1">Payments to review</p>
                </div>
                <div className="glass p-5 border-accent-primary/20 bg-accent-primary/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary mb-1">Talent</p>
                    <p className="text-3xl font-black text-accent-primary">{talents.length}</p>
                    <p className="text-[10px] text-foreground/30 font-bold mt-1">Registered users</p>
                </div>
                <div className="glass p-5 border-accent-success/20 bg-accent-success/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-success mb-1">Jobs</p>
                    <p className="text-3xl font-black text-accent-success">{jobs.length}</p>
                    <p className="text-[10px] text-foreground/30 font-bold mt-1">Total listings</p>
                </div>
                <div className="glass p-5 border-accent-secondary/20 bg-accent-secondary/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-secondary mb-1">Revenue</p>
                    <p className="text-3xl font-black text-accent-secondary">
                        ${payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0)}
                    </p>
                    <p className="text-[10px] text-foreground/30 font-bold mt-1">USDC verified</p>
                </div>
            </div>

            {/* Admin: Post Airdrop */}
            {activeTab === 'airdrops' && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowAirdropForm(f => !f)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-accent-secondary/20 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Post Airdrop (Admin — Free)
                    </button>

                    {showAirdropForm && (
                        <form onSubmit={handleAdminPostAirdrop} className="mt-4 glass p-6 space-y-4 border border-accent-secondary/20">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-widest text-accent-secondary flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> New Airdrop Post</p>
                                <button type="button" onClick={() => setShowAirdropForm(false)}><X className="w-4 h-4 text-foreground/30" /></button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    { key: 'projectName', label: 'Project Name', placeholder: 'Berachain', required: true },
                                    { key: 'blockchain', label: 'Blockchain', placeholder: 'Ethereum', required: true },
                                    { key: 'website', label: 'Website', placeholder: 'https://...', required: true },
                                    { key: 'twitter', label: 'Twitter', placeholder: '@handle', required: true },
                                    { key: 'potentialReward', label: 'Reward', placeholder: '$1,000+', required: true },
                                    { key: 'fundingAmount', label: 'Funding', placeholder: '$42M', required: false },
                                ].map(({ key, label, placeholder, required }) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">{label}</label>
                                        <input required={required} type="text" placeholder={placeholder}
                                            value={(adminAirdropForm as any)[key]}
                                            onChange={e => setAdminAirdropForm(p => ({ ...p, [key]: e.target.value }))}
                                            className="w-full glass bg-white/5 border-white/10 px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-accent-secondary/50" />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Status</label>
                                    <select value={adminAirdropForm.status} onChange={e => setAdminAirdropForm(p => ({ ...p, status: e.target.value as any }))}
                                        className="w-full glass bg-white/5 border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold outline-none uppercase">
                                        <option value="Live">Live</option>
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="Ended">Ended</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Type</label>
                                    <select value={adminAirdropForm.type} onChange={e => setAdminAirdropForm(p => ({ ...p, type: e.target.value as any }))}
                                        className="w-full glass bg-white/5 border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold outline-none uppercase">
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Potential">Potential</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Difficulty</label>
                                    <select value={adminAirdropForm.difficulty} onChange={e => setAdminAirdropForm(p => ({ ...p, difficulty: e.target.value }))}
                                        className="w-full glass bg-white/5 border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold outline-none uppercase">
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                {adminAirdropForm.logoUrl && <img src={adminAirdropForm.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                                <label className={`flex items-center gap-2 px-4 py-2.5 glass bg-white/5 border-white/10 rounded-xl cursor-pointer hover:border-accent-secondary/30 text-xs font-bold text-foreground/40 ${uploadingAdminLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <ImagePlus className="w-3.5 h-3.5" /> {uploadingAdminLogo ? 'Uploading...' : 'Upload Logo'}
                                    <input type="file" accept="image/*" onChange={handleAdminLogoUpload} className="hidden" />
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Description</label>
                                <textarea required rows={2} value={adminAirdropForm.description}
                                    onChange={e => setAdminAirdropForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Why should people participate?"
                                    className="w-full glass bg-white/5 border-white/10 px-3 py-2.5 rounded-xl text-sm font-medium outline-none resize-none focus:border-accent-secondary/50" />
                            </div>

                            {/* Tasks */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 flex items-center gap-1.5"><List className="w-3 h-3" /> Steps</label>
                                    <button type="button" onClick={() => setAdminAirdropForm(p => ({ ...p, tasks: [...p.tasks, ''] }))}
                                        className="text-[10px] font-black text-accent-secondary uppercase tracking-widest flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add
                                    </button>
                                </div>
                                {adminAirdropForm.tasks.map((task, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input type="text" value={task} placeholder={`Step ${idx + 1}`}
                                            onChange={e => { const t = [...adminAirdropForm.tasks]; t[idx] = e.target.value; setAdminAirdropForm(p => ({ ...p, tasks: t })); }}
                                            className="flex-grow glass bg-white/5 border-white/10 px-3 py-2 rounded-xl text-sm font-medium outline-none focus:border-accent-secondary/50" />
                                        <button type="button" onClick={() => setAdminAirdropForm(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== idx) }))}
                                            disabled={adminAirdropForm.tasks.length <= 1}
                                            className="p-2 text-foreground/20 hover:text-accent-danger transition-colors disabled:opacity-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" disabled={airdropFormSubmitting}
                                className="w-full py-3 bg-accent-secondary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                                {airdropFormSubmitting ? 'Posting...' : 'Post Airdrop (Live Instantly)'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full glass bg-white/5 border-white/10 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-accent-primary/30 transition-colors font-medium text-sm"
                />
            </div>

            <div className="glass overflow-hidden border-white/10">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                {activeTab === 'payments' ? 'Payment Info' : 'Details'}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                {activeTab === 'payments' ? 'Amount / Tx Hash' : 'Status/Meta'}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">

                        {/* PAYMENTS TAB */}
                        {activeTab === 'payments' && filteredPayments.map(payment => (
                            <tr key={payment.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${payment.type === 'user_badge' ? 'bg-accent-primary/20 text-accent-primary' :
                                                    payment.type === 'job_post' ? 'bg-accent-success/20 text-accent-success' :
                                                        payment.type === 'airdrop_post' ? 'bg-accent-secondary/20 text-accent-secondary' :
                                                            payment.type === 'cv_boost' ? 'bg-accent-warning/20 text-accent-warning' :
                                                                'bg-white/10 text-foreground/50'
                                                }`}>
                                                {PAYMENT_LABELS[payment.type]}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${payment.status === 'verified' ? 'border-accent-success/30 text-accent-success' :
                                                    payment.status === 'rejected' ? 'border-accent-danger/30 text-accent-danger' :
                                                        'border-accent-warning/30 text-accent-warning'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold">{payment.userDisplayName || 'Unknown'}</p>
                                        <p className="text-xs text-foreground/40 font-medium">{payment.userEmail}</p>
                                        {payment.refName && (
                                            <p className="text-[10px] text-foreground/30 font-medium">Ref: {payment.refName}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="space-y-2">
                                        <p className="text-xl font-black text-accent-success">${payment.amount} USDC</p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-[10px] font-mono text-foreground/40 bg-white/5 px-2 py-1 rounded">
                                                {payment.txHash?.substring(0, 18)}...
                                            </code>
                                            <a
                                                href={`${BASE_EXPLORER_TX}${payment.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-accent-primary hover:scale-110 transition-transform"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    {payment.status === 'pending' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleVerifyPayment(payment)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-accent-success/10 text-accent-success border border-accent-success/20 rounded-xl text-[10px] font-black uppercase hover:bg-accent-success/20 transition-colors"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                                            </button>
                                            <button
                                                onClick={() => handleRejectPayment(payment.id)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-accent-danger/10 text-accent-danger border border-accent-danger/20 rounded-xl text-[10px] font-black uppercase hover:bg-accent-danger/20 transition-colors"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </div>
                                    )}
                                    {payment.status === 'verified' && (
                                        <span className="flex items-center justify-end gap-1.5 text-accent-success text-[10px] font-black uppercase">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                        </span>
                                    )}
                                    {payment.status === 'rejected' && (
                                        <span className="flex items-center justify-end gap-1.5 text-accent-danger text-[10px] font-black uppercase">
                                            <XCircle className="w-3.5 h-3.5" /> Rejected
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {/* JOBS TAB */}
                        {activeTab === 'jobs' && filteredJobs.map(job => (
                            <tr key={job.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {job.logoUrl ? (
                                                <img src={job.logoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Briefcase className="w-5 h-5 text-accent-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase tracking-tight flex items-center gap-2">
                                                {job.roleNeeded}
                                                {job.featured && <Star className="w-3 h-3 text-accent-warning fill-accent-warning" />}
                                                {job.verified && <ShieldCheck className="w-3 h-3 text-accent-success" />}
                                            </p>
                                            <p className="text-xs text-foreground/40 font-medium">{job.projectName} • {job.duration}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6 font-mono text-[10px] text-foreground/60">
                                    <div className="space-y-1">
                                        <p>POSTED BY: {job.postedBy?.substring(0, 8)}...</p>
                                        {job.paymentStatus && (
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${job.paymentStatus === 'verified' ? 'border-accent-success/30 text-accent-success' : 'border-accent-warning/30 text-accent-warning'
                                                }`}>
                                                {job.paymentStatus}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleFeature('jobs', job.id, !!job.featured)}
                                            title={job.featured ? 'Unfeature' : 'Feature'}
                                            className={`p-3 rounded-xl transition-all ${job.featured ? 'bg-accent-warning/20 text-accent-warning' : 'bg-white/5 text-foreground/30 hover:bg-accent-warning/10 hover:text-accent-warning'}`}
                                        >
                                            <Star className={`w-4 h-4 ${job.featured ? 'fill-accent-warning' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => handleVerify(job.id, !!job.verified)}
                                            title={job.verified ? 'Unverify' : 'Verify'}
                                            className={`p-3 rounded-xl transition-all ${job.verified ? 'bg-accent-success/20 text-accent-success' : 'bg-white/5 text-foreground/30 hover:bg-accent-success/10 hover:text-accent-success'}`}
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete('jobs', job.id)}
                                            className="p-3 bg-accent-danger/10 text-accent-danger rounded-xl hover:bg-accent-danger hover:text-white transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* AIRDROPS TAB */}
                        {activeTab === 'airdrops' && filteredAirdrops.map(airdrop => (
                            <tr key={airdrop.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {airdrop.logoUrl ? (
                                                <img src={airdrop.logoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Sparkles className="w-5 h-5 text-accent-secondary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase tracking-tight flex items-center gap-2">
                                                {airdrop.projectName}
                                                {airdrop.featured && <Star className="w-3 h-3 text-accent-warning fill-accent-warning" />}
                                            </p>
                                            <p className="text-xs text-foreground/40 font-medium">{airdrop.blockchain} • {airdrop.difficulty}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6 font-mono text-[10px] text-foreground/60">
                                    <div className="space-y-1">
                                        <p>TASKS: {airdrop.tasks?.length || 0} • STATUS: {airdrop.status}</p>
                                        {airdrop.paymentStatus && (
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${airdrop.paymentStatus === 'verified' ? 'border-accent-success/30 text-accent-success' : 'border-accent-warning/30 text-accent-warning'
                                                }`}>
                                                {airdrop.paymentStatus}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleFeature('airdrops', airdrop.id, !!airdrop.featured)}
                                            title={airdrop.featured ? 'Unfeature' : 'Feature'}
                                            className={`p-3 rounded-xl transition-all ${airdrop.featured ? 'bg-accent-warning/20 text-accent-warning' : 'bg-white/5 text-foreground/30 hover:bg-accent-warning/10 hover:text-accent-warning'}`}
                                        >
                                            <Star className={`w-4 h-4 ${airdrop.featured ? 'fill-accent-warning' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete('airdrops', airdrop.id)}
                                            className="p-3 bg-accent-danger/10 text-accent-danger rounded-xl hover:bg-accent-danger hover:text-white transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* USERS TAB */}
                        {activeTab === 'users' && filteredTalents.map(talent => (
                            <tr key={talent.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-accent-primary/10 overflow-hidden">
                                            {talent.photoUrl ? (
                                                <img src={talent.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-accent-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase tracking-tight">{talent.displayName}</p>
                                            <p className="text-xs text-foreground/40 font-medium">@{talent.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex flex-wrap gap-1">
                                        {talent.roles?.map(r => (
                                            <span key={r} className="px-2 py-0.5 bg-foreground/5 text-[9px] font-black uppercase rounded-sm border border-foreground/5">
                                                {r}
                                            </span>
                                        ))}
                                        {talent.isAdmin && (
                                            <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary text-[9px] font-black uppercase rounded-sm border border-accent-primary/30 flex items-center gap-1">
                                                <ShieldCheck className="w-2 h-2" /> ADMIN
                                            </span>
                                        )}
                                        {talent.hasBadge && (
                                            <span className="px-2 py-0.5 bg-accent-success/20 text-accent-success text-[9px] font-black uppercase rounded-sm border border-accent-success/30">
                                                BADGE
                                            </span>
                                        )}
                                        {talent.hasBadgePending && !talent.hasBadge && (
                                            <span className="px-2 py-0.5 bg-accent-warning/20 text-accent-warning text-[9px] font-black uppercase rounded-sm border border-accent-warning/30 flex items-center gap-1">
                                                <Clock className="w-2 h-2" /> BADGE PENDING
                                            </span>
                                        )}
                                        {talent.cvBoosted && (
                                            <span className="px-2 py-0.5 bg-accent-secondary/20 text-accent-secondary text-[9px] font-black uppercase rounded-sm border border-accent-secondary/30">
                                                CV BOOSTED
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleDelete('talents', talent.id)}
                                            className="p-3 bg-accent-danger/10 text-accent-danger rounded-xl hover:bg-accent-danger hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {activeCount === 0 && (
                    <div className="py-20 text-center space-y-3">
                        <p className="text-2xl font-black text-foreground/10 uppercase tracking-widest">Empty</p>
                        <p className="text-foreground/30 text-sm font-medium">
                            {search
                                ? `No results for "${search}"`
                                : activeTab === 'users'
                                    ? 'No talent profiles yet. Users must complete onboarding to appear here.'
                                    : activeTab === 'payments'
                                        ? 'No payments yet. They will appear here when users submit.'
                                        : `No ${activeTab} yet.`
                            }
                        </p>
                        {!search && activeTab === 'users' && (
                            <p className="text-[10px] text-foreground/20 font-bold uppercase tracking-widest">
                                Tip: Ask users to complete /onboarding to create their profile
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
