'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import AuthGuard from '@/components/auth/AuthGuard';
import PaymentModal from '@/components/PaymentModal';
import { Sparkles, Globe, ArrowRight, CheckCircle2, List, Plus, Trash2, AlertTriangle, ImagePlus, X, Clock } from 'lucide-react';
import { PRICES } from '@/lib/payments';

export default function SubmitAirdropPage() {
    return (
        <AuthGuard>
            <SubmitAirdropForm />
        </AuthGuard>
    );
}

function SubmitAirdropForm() {
    const router = useRouter();
    const { user } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [formData, setFormData] = useState({
        projectName: '',
        website: '',
        twitter: '',
        logoUrl: '',
        blockchain: '',
        difficulty: 'Medium',
        status: 'Upcoming' as 'Live' | 'Upcoming' | 'Ended',
        type: 'Potential' as 'Confirmed' | 'Potential',
        fundingAmount: '',
        potentialReward: '',
        description: '',
        tasks: ['Follow Twitter', 'Join Discord'] as string[]
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, SVG, etc.).');
            e.target.value = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Logo must be under 2MB.');
            e.target.value = '';
            return;
        }

        setUploadingLogo(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }
            const { url } = await res.json();
            setFormData(prev => ({ ...prev, logoUrl: url }));
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Error uploading logo. Please try again.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const addTask = () => setFormData({ ...formData, tasks: [...formData.tasks, ''] });
    const removeTask = (index: number) => {
        const newTasks = formData.tasks.filter((_, i) => i !== index);
        setFormData({ ...formData, tasks: newTasks });
    };
    const updateTask = (index: number, val: string) => {
        const newTasks = [...formData.tasks];
        newTasks[index] = val;
        setFormData({ ...formData, tasks: newTasks });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowPaymentModal(true);
    };

    const handlePaymentConfirm = async (txHash: string) => {
        setLoading(true);
        try {
            const airdropRef = await addDoc(collection(db, 'airdrops'), {
                ...formData,
                submittedBy: user?.id,
                participationCount: '0',
                paymentStatus: 'pending',
                paymentTxHash: txHash,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await addDoc(collection(db, 'payments'), {
                userId: user?.id || '',
                userEmail: user?.email || '',
                userDisplayName: user?.displayName || '',
                type: 'airdrop_post',
                amount: PRICES.AIRDROP_POST,
                txHash,
                status: 'pending',
                refId: airdropRef.id,
                refName: formData.projectName,
                createdAt: serverTimestamp(),
            });

            setShowPaymentModal(false);
            setSuccess(true);
        } catch (err) {
            console.error('Error submitting airdrop:', err);
            alert('Failed to submit airdrop. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-32 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-accent-success/20 flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-10 h-10 text-accent-success" />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tight">Payment Submitted!</h1>
                <p className="text-foreground/60 text-lg">Your airdrop will go live within 24h after payment is verified.</p>
                <div className="flex items-center justify-center gap-2 text-accent-warning text-sm font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Awaiting payment verification</span>
                </div>
                <button
                    onClick={() => router.push('/airdrops')}
                    className="mt-4 px-8 py-3 bg-foreground text-background font-black rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-widest"
                >
                    Browse Airdrops
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-black uppercase tracking-tight mb-4 text-accent-secondary">Submit <span className="text-foreground">Alpha</span></h1>
                <p className="text-foreground/40 font-medium">Found an early gem? Share it with the community.</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent-success/10 border border-accent-success/20 rounded-xl text-accent-success text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> ${PRICES.AIRDROP_POST} USDC one-time listing fee · Pay at checkout
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Project Section */}
                <section className="glass p-8 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-secondary flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Project Intel
                    </h2>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Project Logo (Optional)</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {formData.logoUrl ? (
                                    <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Sparkles className="w-6 h-6 text-foreground/20" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <label className={`flex items-center gap-3 px-4 py-3 glass bg-white/5 border-white/10 rounded-xl cursor-pointer hover:border-accent-secondary/30 transition-all ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <ImagePlus className="w-4 h-4 text-accent-secondary shrink-0" />
                                    <span className="text-sm font-medium text-foreground/60">
                                        {uploadingLogo ? 'Uploading...' : 'Upload logo image'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-[10px] text-foreground/20 px-1">PNG, JPG, SVG — max 2MB</p>
                            </div>

                            {formData.logoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                                    className="p-2 text-foreground/30 hover:text-accent-danger transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Project Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Berachain"
                                value={formData.projectName}
                                onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Blockchain</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Ethereum, Cosmos"
                                value={formData.blockchain}
                                onChange={e => setFormData({ ...formData, blockchain: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Website</label>
                            <input
                                required
                                type="url"
                                placeholder="https://..."
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Twitter Handle</label>
                            <input
                                required
                                type="text"
                                placeholder="@username"
                                value={formData.twitter}
                                onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </section>

                {/* Alpha Stats */}
                <section className="glass p-8 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-secondary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Opportunity Stats
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Reward Potential</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. $1,000+ or Token"
                                value={formData.potentialReward}
                                onChange={e => setFormData({ ...formData, potentialReward: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Funding</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. $42M from Paradigm"
                                value={formData.fundingAmount}
                                onChange={e => setFormData({ ...formData, fundingAmount: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Difficulty</label>
                            <select
                                value={formData.difficulty}
                                onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-bold text-xs uppercase"
                            >
                                <option value="Easy">Simple Socials</option>
                                <option value="Medium">Swaps / Liquidity</option>
                                <option value="Hard">Node / Devnet</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as 'Live' | 'Upcoming' | 'Ended' })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-bold text-xs uppercase"
                            >
                                <option value="Live">Live Now</option>
                                <option value="Upcoming">Upcoming</option>
                                <option value="Ended">Ended</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Confirmation</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as 'Confirmed' | 'Potential' })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-bold text-xs uppercase"
                            >
                                <option value="Confirmed">Confirmed Token</option>
                                <option value="Potential">Potential / Unconfirmed</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Description</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Why should people participate?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-secondary/50 outline-none transition-all font-medium resize-none"
                        />
                    </div>
                </section>

                {/* Task Checklist */}
                <section className="glass p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-success flex items-center gap-2">
                            <List className="w-4 h-4" /> Step-by-Step Guide
                        </h2>
                        <button
                            type="button"
                            onClick={addTask}
                            className="text-[10px] font-black uppercase tracking-widest text-accent-success hover:scale-105 transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-3 h-3" /> Add Task
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.tasks.map((task, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    required
                                    type="text"
                                    placeholder="Task description..."
                                    value={task}
                                    onChange={e => updateTask(idx, e.target.value)}
                                    className="flex-grow glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-success/50 outline-none transition-all font-medium text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTask(idx)}
                                    disabled={formData.tasks.length <= 1}
                                    className="p-3 text-foreground/20 hover:text-accent-danger transition-colors disabled:opacity-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex items-center gap-4 bg-accent-warning/5 border border-accent-warning/20 p-6 rounded-2xl">
                    <AlertTriangle className="w-6 h-6 text-accent-warning shrink-0" />
                    <p className="text-xs text-foreground/60 leading-relaxed">
                        Alpha submission is high-stakes. Ensure all links are official to protect the community from drains. Listing fee: <strong>${PRICES.AIRDROP_POST} USDC</strong>.
                    </p>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 text-xs font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        disabled={uploadingLogo}
                        className="px-12 py-4 bg-foreground text-background font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                    >
                        CONTINUE TO PAYMENT
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </form>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handlePaymentConfirm}
                amount={PRICES.AIRDROP_POST}
                description="Airdrop Listing Fee"
                loading={loading}
            />
        </div>
    );
}
