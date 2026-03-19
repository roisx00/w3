'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { usePrivy } from '@privy-io/react-auth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    collection, doc, updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { JobPosting, Airdrop, TalentProfile, PaymentRecord, KOLProfile } from '@/lib/types';
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
    List,
    Loader2,
    Zap,
    FileText,
    Send
} from 'lucide-react';
import { PAYMENT_LABELS, BASE_EXPLORER_TX } from '@/lib/payments';

type Tab = 'jobs' | 'airdrops' | 'users' | 'kols' | 'payments' | 'proposals';

export default function AdminDashboard() {
    const { user, isLoggedIn, authLoading } = useAppContext();
    const { getAccessToken } = usePrivy();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('payments');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
    const [talents, setTalents] = useState<TalentProfile[]>([]);
    const [kols, setKols] = useState<KOLProfile[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [proposals, setProposals] = useState<any[]>([]);
    const [showAirdropForm, setShowAirdropForm] = useState(false);
    const [airdropFormSubmitting, setAirdropFormSubmitting] = useState(false);
    const [uploadingAdminLogo, setUploadingAdminLogo] = useState(false);
    const [uploadingTaskIdx, setUploadingTaskIdx] = useState<number | null>(null);
    const [editingAirdropId, setEditingAirdropId] = useState<string | null>(null);
    const [adminAirdropForm, setAdminAirdropForm] = useState({
        projectName: '', website: '', twitter: '', logoUrl: '',
        blockchain: '', difficulty: 'Medium', status: 'Live' as 'Live' | 'Upcoming' | 'Ended',
        type: 'Confirmed' as 'Confirmed' | 'Potential',
        fundingAmount: '', potentialReward: '', description: '',
        tasks: [{ text: '', url: '', linkText: '', imageUrl: '' }],
    });

    const resetAirdropForm = () => {
        setAdminAirdropForm({ projectName: '', website: '', twitter: '', logoUrl: '', blockchain: '', difficulty: 'Medium', status: 'Live', type: 'Confirmed', fundingAmount: '', potentialReward: '', description: '', tasks: [{ text: '', url: '', linkText: '', imageUrl: '' }] });
        setEditingAirdropId(null);
    };
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/');
        }
    }, [authLoading, isLoggedIn, router]);

    const ADMIN_EMAIL = 'roisx00@gmail.com';

    const fetchData = async () => {
        const isOwner = user?.email === ADMIN_EMAIL;
        console.log('[Admin] fetchData — email:', user?.email, '| isOwner:', isOwner, '| isAdmin field:', user?.isAdmin);

        if (!user?.isAdmin && !isOwner) {
            console.log('[Admin] Not admin — email does not match and no isAdmin field');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            console.log('[Admin] Got Privy token:', token ? 'yes' : 'NO TOKEN');
            if (!token) throw new Error('No auth token — please re-login');

            const res = await fetch('/api/admin/data', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            console.log('[Admin] /api/admin/data status:', res.status);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            console.log('[Admin] Data received — jobs:', data.jobs?.length, 'payments:', data.payments?.length);

            setJobs(data.jobs || []);
            setAirdrops(data.airdrops || []);
            setTalents(data.talents || []);
            setKols(data.kols || []);
            setPayments(data.payments || []);
            setProposals(data.proposals || []);
        } catch (err: any) {
            console.error('[Admin] fetchData error:', err);
            setError(err.message || 'Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchData();
    }, [authLoading, user?.id]);

    const handleDelete = async (coll: string, id: string) => {
        if (!window.confirm('Permanently delete this? This cannot be undone.')) return;
        try {
            const tok = await getAccessToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(tok ? { 'Authorization': `Bearer ${tok}` } : {}) };
            const res = await fetch('/api/admin/delete', { method: 'POST', headers, body: JSON.stringify({ collection: coll, id }) });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Delete failed'); }
            fetchData();
        } catch (err: any) {
            alert('Failed to delete: ' + (err.message || 'Unknown error'));
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
        const token = await getAccessToken();
        const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
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
                case 'kol_badge':
                    await fetch('/api/kols/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ userId: payment.userId, data: { hasBadge: true, badgeTxHash: payment.txHash || '' } }),
                    });
                    break;
                case 'kol_boost': {
                    const expiry = new Date();
                    expiry.setDate(expiry.getDate() + 30);
                    await fetch('/api/kols/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ userId: payment.userId, data: { kolBoosted: true, kolBoostExpiry: expiry.toISOString() } }),
                    });
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

    const [manualBadgeInput, setManualBadgeInput] = useState('');
    const [manualBadgeTx, setManualBadgeTx] = useState('');
    const [manualBadgeLoading, setManualBadgeLoading] = useState(false);
    const [manualBadgeType, setManualBadgeType] = useState<'resume' | 'kol'>('resume');

    const handleManualBadgeGrant = async () => {
        const input = manualBadgeInput.trim();
        if (!input) { alert('Enter a user ID or email.'); return; }
        setManualBadgeLoading(true);
        try {
            let targetId = input;
            if (!input.startsWith('0x') && input.includes('@')) {
                const match = talents.find(t => t.email?.toLowerCase() === input.toLowerCase());
                if (!match) { alert('No user found with that email. Try their UID instead.'); setManualBadgeLoading(false); return; }
                targetId = match.id;
            }

            const adminToken = await getAccessToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}) };
            const grantRes = await fetch('/api/admin/grant-badge', {
                method: 'POST',
                headers,
                body: JSON.stringify({ targetId, type: manualBadgeType, txHash: manualBadgeTx.trim() || 'admin-grant' }),
            });
            if (!grantRes.ok) {
                const errData = await grantRes.json();
                throw new Error(errData.error || 'Grant failed');
            }

            alert(`${manualBadgeType === 'resume' ? 'Resume' : 'KOL'} Badge granted to ${targetId}`);
            setManualBadgeInput('');
            setManualBadgeTx('');
            fetchData();
        } catch (err: any) {
            alert('Failed: ' + (err.message || 'Unknown error'));
        } finally {
            setManualBadgeLoading(false);
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
    const filteredKols = kols.filter(k =>
        !search ||
        k.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        k.username?.toLowerCase().includes(search.toLowerCase())
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
            const validTasks = adminAirdropForm.tasks.filter(t => t.text.trim());
            const airdropData = {
                ...adminAirdropForm,
                tasks: validTasks.map(t => (t.url?.trim() || t.imageUrl?.trim()) ? t : t.text),
                updatedAt: serverTimestamp(),
            };

            if (editingAirdropId) {
                await updateDoc(doc(db, 'airdrops', editingAirdropId), airdropData);
            } else {
                await addDoc(collection(db, 'airdrops'), {
                    ...airdropData,
                    submittedBy: user?.id,
                    participationCount: '0',
                    paymentStatus: 'verified',
                    isAdminPost: true,
                    createdAt: serverTimestamp(),
                });
            }
            setShowAirdropForm(false);
            resetAirdropForm();
            fetchData();
        } catch { alert('Failed to save airdrop.'); }
        finally { setAirdropFormSubmitting(false); }
    };

    const openEditAirdrop = (airdrop: Airdrop) => {
        setAdminAirdropForm({
            projectName: airdrop.projectName || '',
            website: airdrop.website || '',
            twitter: airdrop.twitter || '',
            logoUrl: airdrop.logoUrl || '',
            blockchain: airdrop.blockchain || '',
            difficulty: airdrop.difficulty || 'Medium',
            status: airdrop.status || 'Live',
            type: airdrop.type || 'Confirmed',
            fundingAmount: airdrop.fundingAmount || '',
            potentialReward: airdrop.potentialReward || '',
            description: airdrop.description || '',
            tasks: (airdrop.tasks?.length ? airdrop.tasks : [{ text: '', url: '', linkText: '', imageUrl: '' }]).map(t =>
                typeof t === 'string' ? { text: t, url: '', linkText: '', imageUrl: '' } : { text: t.text, url: t.url || '', linkText: t.linkText || '', imageUrl: t.imageUrl || '' }
            )
        });
        setEditingAirdropId(airdrop.id);
        setShowAirdropForm(true);
        setActiveTab('airdrops');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const pendingCount = payments.filter(p => p.status === 'pending').length;

    if (authLoading || loading) return (
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

    if (!user?.isAdmin && user?.email !== ADMIN_EMAIL) {
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
                : activeTab === 'kols' ? filteredKols.length
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
                    <button
                        onClick={() => { setActiveTab('kols'); setSearch(''); }}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'kols' ? 'bg-foreground text-background' : 'hover:bg-white/5'}`}
                    >
                        KOLs ({kols.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('proposals'); setSearch(''); }}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'proposals' ? 'bg-foreground text-background' : 'hover:bg-white/5'}`}
                    >
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        Proposals
                        {proposals.filter(p => p.status === 'new').length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-yellow-400 text-background text-[9px] font-black flex items-center justify-center">
                                {proposals.filter(p => p.status === 'new').length}
                            </span>
                        )}
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
                        onClick={() => { resetAirdropForm(); setShowAirdropForm(f => !f); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-accent-secondary/20 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Post Airdrop (Admin — Free)
                    </button>

                    {showAirdropForm && (
                        <form onSubmit={handleAdminPostAirdrop} className="mt-4 glass p-6 space-y-4 border border-accent-secondary/20">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-widest text-accent-secondary flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {editingAirdropId ? 'Edit Airdrop' : 'New Airdrop Post'}
                                </p>
                                <button type="button" onClick={() => { setShowAirdropForm(false); resetAirdropForm(); }}><X className="w-4 h-4 text-foreground/30" /></button>
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 flex items-center gap-1.5"><List className="w-3 h-3" /> Steps</label>
                                    <button type="button" onClick={() => setAdminAirdropForm(p => ({ ...p, tasks: [...p.tasks, { text: '', url: '', linkText: '', imageUrl: '' }] }))}
                                        className="text-[10px] font-black text-accent-secondary uppercase tracking-widest flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add Step
                                    </button>
                                </div>
                                {adminAirdropForm.tasks.map((task, idx) => (
                                    <div key={idx} className="flex gap-2 mb-4 p-4 glass rounded-xl border border-white/5 bg-white-[0.02]">
                                        <div className="flex-grow space-y-3">
                                            <input type="text" value={task.text} placeholder={`Step ${idx + 1} Description (e.g. Visit the website and sign up)`}
                                                onChange={e => { const t = [...adminAirdropForm.tasks]; t[idx] = { ...t[idx], text: e.target.value }; setAdminAirdropForm(p => ({ ...p, tasks: t })); }}
                                                className="w-full glass bg-white/5 border-white/10 px-3 py-2 rounded-xl text-sm font-medium outline-none focus:border-accent-secondary/50" />
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input type="text" value={task.url} placeholder="Target URL (e.g. https://...)"
                                                    onChange={e => { const t = [...adminAirdropForm.tasks]; t[idx] = { ...t[idx], url: e.target.value }; setAdminAirdropForm(p => ({ ...p, tasks: t })); }}
                                                    className="w-full sm:w-1/3 glass bg-white/5 border-white/10 px-3 py-2 rounded-xl text-xs font-medium outline-none focus:border-accent-secondary/50 text-accent-primary placeholder:text-foreground/30" />
                                                <input type="text" value={task.linkText || ''} placeholder="Specific word to link (e.g. 'website')"
                                                    onChange={e => { const t = [...adminAirdropForm.tasks]; t[idx] = { ...t[idx], linkText: e.target.value }; setAdminAirdropForm(p => ({ ...p, tasks: t })); }}
                                                    className="w-full sm:w-1/3 glass bg-white/5 border-white/10 px-3 py-2 rounded-xl text-xs font-medium outline-none focus:border-accent-secondary/50 text-accent-secondary placeholder:text-foreground/30" />
                                                <div className="w-full sm:w-1/3 flex items-center gap-2">
                                                    {task.imageUrl && <img src={task.imageUrl} alt="" className="w-8 h-8 rounded shrink-0 object-cover" />}
                                                    <label className={`flex-1 flex items-center justify-center gap-1.5 glass bg-white/5 border-white/10 px-3 py-2 rounded-xl cursor-pointer hover:border-accent-secondary/30 text-xs font-bold text-foreground/50 transition-colors truncate ${uploadingTaskIdx === idx ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {uploadingTaskIdx === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 shrink-0" />}
                                                        <span className="truncate">{uploadingTaskIdx === idx ? 'Uploading...' : task.imageUrl ? 'Change Image' : 'Attach Image'}</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            setUploadingTaskIdx(idx);
                                                            try {
                                                                const data = new FormData();
                                                                data.append('file', file);
                                                                const res = await fetch('/api/upload', { method: 'POST', body: data });
                                                                if (!res.ok) throw new Error('Upload failed');
                                                                const { url } = await res.json();

                                                                const t = [...adminAirdropForm.tasks];
                                                                t[idx] = { ...t[idx], imageUrl: url };
                                                                setAdminAirdropForm(p => ({ ...p, tasks: t }));
                                                            } catch (err) {
                                                                console.error('Error uploading task image', err);
                                                                alert('Failed to upload image.');
                                                            } finally {
                                                                setUploadingTaskIdx(null);
                                                                e.target.value = '';
                                                            }
                                                        }} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setAdminAirdropForm(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== idx) }))}
                                            disabled={adminAirdropForm.tasks.length <= 1}
                                            className="p-2 text-foreground/20 hover:text-accent-danger transition-colors disabled:opacity-0 self-start mt-1">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" disabled={airdropFormSubmitting}
                                className="w-full py-3 bg-accent-secondary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                                {airdropFormSubmitting ? 'Saving...' : (editingAirdropId ? 'Save Changes' : 'Post Airdrop (Live Instantly)')}
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

            {activeTab !== 'proposals' && <div className="glass overflow-hidden border-white/10">
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
                                            onClick={() => openEditAirdrop(airdrop)}
                                            title="Edit Airdrop"
                                            className="p-3 bg-white/5 text-foreground/30 hover:bg-white/10 hover:text-foreground transition-all rounded-xl"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                                        </button>
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

                        {/* USERS TAB — Manual Badge Grant */}
                        {activeTab === 'users' && (
                            <tr>
                                <td colSpan={4} className="px-6 pt-6 pb-2">
                                    <div className="bg-accent-warning/5 border border-accent-warning/20 rounded-2xl p-5 space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent-warning flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Manual Badge Grant
                                        </p>
                                        {/* Badge type toggle */}
                                        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                                            <button onClick={() => setManualBadgeType('resume')}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${manualBadgeType === 'resume' ? 'bg-amber-500 text-white' : 'text-foreground/40 hover:text-foreground/70'}`}>
                                                Resume Badge
                                            </button>
                                            <button onClick={() => setManualBadgeType('kol')}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${manualBadgeType === 'kol' ? 'bg-purple-500 text-white' : 'text-foreground/40 hover:text-foreground/70'}`}>
                                                KOL Badge
                                            </button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                value={manualBadgeInput}
                                                onChange={e => setManualBadgeInput(e.target.value)}
                                                placeholder="User UID or email address"
                                                className="flex-1 glass bg-white/5 border-white/10 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-accent-warning/50"
                                            />
                                            <input
                                                type="text"
                                                value={manualBadgeTx}
                                                onChange={e => setManualBadgeTx(e.target.value)}
                                                placeholder="Tx hash (optional)"
                                                className="flex-1 glass bg-white/5 border-white/10 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-accent-warning/50"
                                            />
                                            <button
                                                onClick={handleManualBadgeGrant}
                                                disabled={manualBadgeLoading || !manualBadgeInput.trim()}
                                                className={`px-5 py-2 font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2 ${manualBadgeType === 'kol' ? 'bg-purple-500 text-white' : 'bg-amber-500 text-white'}`}
                                            >
                                                {manualBadgeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                Grant {manualBadgeType === 'kol' ? 'KOL' : 'Resume'} Badge
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-foreground/30 font-medium">
                                            Enter the user&apos;s Privy DID (from Users tab). KOL badge requires user to have a KOL profile. Tx hash optional for manual/free grants.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
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
                                            onClick={async () => {
                                                const tok = await getAccessToken();
                                                const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(tok ? { 'Authorization': `Bearer ${tok}` } : {}) };
                                                const res = await fetch('/api/admin/set-admin', { method: 'POST', headers, body: JSON.stringify({ targetId: talent.id, revoke: !!talent.isAdmin }) });
                                                if (res.ok) fetchData();
                                                else alert((await res.json()).error || 'Failed');
                                            }}
                                            title={talent.isAdmin ? 'Revoke admin' : 'Grant admin'}
                                            className={`p-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 ${talent.isAdmin ? 'bg-accent-primary/20 text-accent-primary hover:bg-red-500/20 hover:text-red-400' : 'bg-white/5 text-foreground/30 hover:bg-accent-primary/20 hover:text-accent-primary'}`}
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                        </button>
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
            </div>}

            {/* KOLS TAB */}
            {activeTab === 'kols' && (
                <div className="space-y-3">
                    {filteredKols.length === 0 ? (
                        <div className="glass rounded-2xl py-20 text-center">
                            <p className="text-foreground/20 font-bold uppercase tracking-widest">No KOL profiles yet</p>
                        </div>
                    ) : filteredKols.map(kol => (
                        <div key={kol.id} className="glass p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-red-400">
                                {kol.photoUrl ? <img src={kol.photoUrl} className="w-full h-full object-cover" alt="" /> : (kol.displayName || 'K').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                    <span className="font-black text-sm">{kol.displayName}</span>
                                    <span className="text-[10px] text-foreground/40">@{kol.username}</span>
                                    {kol.hasBadge && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">BADGED</span>}
                                    {kol.verified && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">VERIFIED</span>}
                                    {kol.kolBoosted && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">BOOSTED</span>}
                                </div>
                                <div className="flex flex-wrap gap-3 text-[10px] text-foreground/40">
                                    <span>{kol.niches?.join(', ') || 'No niches'}</span>
                                    {kol.totalReach ? <span>{kol.totalReach >= 1000000 ? `${(kol.totalReach / 1000000).toFixed(1)}M` : `${Math.round(kol.totalReach / 1000)}K`} reach</span> : null}
                                    <span className="font-mono text-[9px] text-foreground/20">{kol.id}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={async () => {
                                        const token = await getAccessToken();
                                        const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
                                        await fetch('/api/kols/save', { method: 'POST', headers, body: JSON.stringify({ userId: kol.id, data: { verified: !kol.verified } }) });
                                        fetchData();
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${kol.verified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 border-white/10 text-foreground/40 hover:border-emerald-500/30'}`}
                                >
                                    {kol.verified ? 'Verified' : 'Verify'}
                                </button>
                                <a href={`/kols/${kol.id}`} target="_blank" className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-foreground/40 hover:border-white/20 transition-all">
                                    View
                                </a>
                                <button
                                    onClick={() => handleDelete('kols', kol.id)}
                                    className="p-1.5 rounded-xl bg-accent-danger/10 text-accent-danger hover:bg-accent-danger hover:text-white transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PROPOSALS TAB */}
            {activeTab === 'proposals' && (
                <div className="space-y-4">
                    {proposals.length === 0 ? (
                        <div className="glass rounded-2xl py-20 text-center">
                            <Zap className="w-10 h-10 text-foreground/10 mx-auto mb-4" />
                            <p className="text-foreground/20 font-bold uppercase tracking-widest">No proposals yet</p>
                        </div>
                    ) : (
                        proposals
                            .filter(p => !search || p.projectName?.toLowerCase().includes(search.toLowerCase()) || p.twitter?.toLowerCase().includes(search.toLowerCase()) || p.specificKOL?.toLowerCase().includes(search.toLowerCase()))
                            .map(p => (
                                <div key={p.id} className={`glass border rounded-2xl p-6 transition-all ${p.status === 'new' ? 'border-yellow-400/20' : 'border-white/5'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                        {/* Left */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-black text-base">{p.projectName}</span>
                                                {p.status === 'new' && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">New</span>
                                                )}
                                                {p.status === 'contacted' && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">Contacted</span>
                                                )}
                                                <span className="text-[10px] text-foreground/30 font-mono">
                                                    {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : '—'}
                                                </span>
                                            </div>

                                            <p className="text-sm text-foreground/60 leading-relaxed">{p.description}</p>

                                            <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                                                {p.campaignType && <span className="px-2.5 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">{p.campaignType}</span>}
                                                {p.budget && <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">{p.budget}</span>}
                                                {p.timeline && <span className="px-2.5 py-1 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-400">{p.timeline}</span>}
                                                {p.targetNiches?.map((n: string) => (
                                                    <span key={n} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/50">{n}</span>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                                {p.twitter && (
                                                    <a href={`https://x.com/${p.twitter}`} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-accent-primary hover:underline font-bold">
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                                                        @{p.twitter}
                                                    </a>
                                                )}
                                                {p.telegram && (
                                                    <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                                                        <Send className="w-3 h-3" />
                                                        @{p.telegram}
                                                    </span>
                                                )}
                                                {p.specificKOL && (
                                                    <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                                                        <Zap className="w-3 h-3" />
                                                        Wants: {p.specificKOL}
                                                    </span>
                                                )}
                                                {p.notes && (
                                                    <span className="flex items-center gap-1.5 text-foreground/40 font-medium">
                                                        <FileText className="w-3 h-3" />
                                                        {p.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex sm:flex-col gap-2">
                                            {p.status === 'new' && (
                                                <button
                                                    onClick={async () => {
                                                        await updateDoc(doc(db, 'kol_proposals', p.id), { status: 'contacted' });
                                                        fetchData();
                                                    }}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-400/20 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Mark Contacted
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete('kol_proposals', p.id)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-400/10 border border-red-400/20 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-400/20 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}
        </div>
    );
}
