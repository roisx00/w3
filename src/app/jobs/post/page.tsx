'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import AuthGuard from '@/components/auth/AuthGuard';
import PaymentModal from '@/components/PaymentModal';
import { Briefcase, DollarSign, Globe, ArrowRight, CheckCircle2, AlertCircle, ImagePlus, X, Clock, Zap } from 'lucide-react';
import { PRICES } from '@/lib/payments';
import { checkJobPromo } from '@/lib/promos';

export default function PostJobPage() {
    return (
        <AuthGuard>
            <PostJobForm />
        </AuthGuard>
    );
}

function PostJobForm() {
    const router = useRouter();
    const { user } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successFree, setSuccessFree] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isPromoFree, setIsPromoFree] = useState(false);
    const [jobsRemaining, setJobsRemaining] = useState(0);

    useEffect(() => {
        checkJobPromo().then(({ isFree, remaining }) => {
            setIsPromoFree(isFree);
            setJobsRemaining(remaining);
        });
    }, []);

    const [formData, setFormData] = useState({
        projectName: '',
        website: '',
        twitter: '',
        logoUrl: '',
        roleNeeded: '',
        description: '',
        experienceLevel: 'Mid',
        isRemote: true,
        duration: 'Permanent',
        paymentConfig: {
            amount: '',
            currency: 'USDC',
            type: 'Salary'
        }
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isPromoFree) {
            handleFreePost();
        } else {
            setShowPaymentModal(true);
        }
    };

    const handleFreePost = async () => {
        setLoading(true);
        try {
            await addDoc(collection(db, 'jobs'), {
                ...formData,
                postedBy: user?.id,
                status: 'Open',
                paymentStatus: 'verified',
                isFree: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setSuccessFree(true);
            setSuccess(true);
        } catch (err) {
            console.error('Error posting job:', err);
            alert('Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentConfirm = async (txHash: string) => {
        setLoading(true);
        try {
            // Payment already verified on-chain — post goes live instantly
            const jobRef = await addDoc(collection(db, 'jobs'), {
                ...formData,
                postedBy: user?.id,
                status: 'Open',
                paymentStatus: 'verified',
                paymentTxHash: txHash,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await addDoc(collection(db, 'payments'), {
                userId: user?.id || '',
                userEmail: user?.email || '',
                userDisplayName: user?.displayName || '',
                type: 'job_post',
                amount: PRICES.JOB_POST,
                txHash,
                status: 'verified',
                refId: jobRef.id,
                refName: formData.projectName,
                createdAt: serverTimestamp(),
            });

            setShowPaymentModal(false);
            setSuccessFree(true);  // reuse "live" success screen
            setSuccess(true);
        } catch (err) {
            console.error('Error posting job:', err);
            alert('Failed to post job. Please try again.');
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
                {successFree ? (
                    <>
                        <h1 className="text-4xl font-black uppercase tracking-tight">Your Job is Live!</h1>
                        <p className="text-foreground/60 text-lg">Posted free during our launch promo. Talent can apply now.</p>
                        <div className="flex items-center justify-center gap-2 text-accent-success text-sm font-bold">
                            <Zap className="w-4 h-4" />
                            <span>Live instantly — no payment needed</span>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-black uppercase tracking-tight">Payment Submitted!</h1>
                        <p className="text-foreground/60 text-lg">Your listing is under review and will go live within 24h after payment is verified.</p>
                        <div className="flex items-center justify-center gap-2 text-accent-warning text-sm font-bold">
                            <Clock className="w-4 h-4" />
                            <span>Awaiting payment verification</span>
                        </div>
                    </>
                )}
                <button
                    onClick={() => router.push('/jobs')}
                    className="mt-4 px-8 py-3 bg-foreground text-background font-black rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-widest"
                >
                    Browse Jobs
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Post a <span className="text-accent-primary">Job</span></h1>
                <p className="text-foreground/40 font-medium">Find the elite talent your project deserves.</p>
                {isPromoFree ? (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 rounded-xl text-accent-primary text-xs font-bold">
                        <Zap className="w-4 h-4" /> FREE during launch — {jobsRemaining} of 50 free spots remaining
                    </div>
                ) : (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent-success/10 border border-accent-success/20 rounded-xl text-accent-success text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> ${PRICES.JOB_POST} USDC one-time listing fee · Pay at checkout
                    </div>
                )}
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Project Info Section */}
                <section className="glass p-8 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-primary flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Project Identity
                    </h2>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Project Logo (Optional)</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {formData.logoUrl ? (
                                    <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Briefcase className="w-6 h-6 text-foreground/20" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <label className={`flex items-center gap-3 px-4 py-3 glass bg-white/5 border-white/10 rounded-xl cursor-pointer hover:border-accent-primary/30 transition-all ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <ImagePlus className="w-4 h-4 text-accent-primary shrink-0" />
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
                                placeholder="e.g. Uniswap"
                                value={formData.projectName}
                                onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-medium"
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
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Twitter Handle</label>
                            <input
                                required
                                type="text"
                                placeholder="@username"
                                value={formData.twitter}
                                onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </section>

                {/* Role Details Section */}
                <section className="glass p-8 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-primary flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Role Details
                    </h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Role Needed</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Senior Smart Contract Engineer"
                                value={formData.roleNeeded}
                                onChange={e => setFormData({ ...formData, roleNeeded: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Description</label>
                            <textarea
                                required
                                rows={5}
                                placeholder="Describe the mission, the tech stack, and why you need them..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-medium resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Experience</label>
                                <select
                                    value={formData.experienceLevel}
                                    onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-bold text-xs uppercase"
                                >
                                    <option value="Entry">Entry-level</option>
                                    <option value="Mid">Mid-level</option>
                                    <option value="Senior">Senior</option>
                                    <option value="Lead">Lead / Architect</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Location</label>
                                <select
                                    value={formData.isRemote ? 'remote' : 'onsite'}
                                    onChange={e => setFormData({ ...formData, isRemote: e.target.value === 'remote' })}
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-bold text-xs uppercase"
                                >
                                    <option value="remote">Remote</option>
                                    <option value="onsite">On-site</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Duration</label>
                                <select
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none transition-all font-bold text-xs uppercase"
                                >
                                    <option value="Permanent">Permanent</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Part-time">Part-time</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Payment Section */}
                <section className="glass p-8 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-success flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Compensation
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Amount</label>
                            <input
                                required
                                type="text"
                                placeholder="5,000 - 8,000"
                                value={formData.paymentConfig.amount}
                                onChange={e => setFormData({
                                    ...formData,
                                    paymentConfig: { ...formData.paymentConfig, amount: e.target.value }
                                })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-success/50 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Currency</label>
                            <select
                                value={formData.paymentConfig.currency}
                                onChange={e => setFormData({
                                    ...formData,
                                    paymentConfig: { ...formData.paymentConfig, currency: e.target.value }
                                })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-success/50 outline-none transition-all font-bold text-xs uppercase"
                            >
                                <option value="USDC">USDC (Stable)</option>
                                <option value="ETH">ETH</option>
                                <option value="USDT">USDT</option>
                                <option value="DAI">DAI</option>
                                <option value="SOL">SOL</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Payment Type</label>
                            <select
                                value={formData.paymentConfig.type}
                                onChange={e => setFormData({
                                    ...formData,
                                    paymentConfig: { ...formData.paymentConfig, type: e.target.value }
                                })}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-success/50 outline-none transition-all font-bold text-xs uppercase"
                            >
                                <option value="Salary">Salary</option>
                                <option value="Token">Token</option>
                                <option value="Revenue Share">Revenue Share</option>
                                <option value="Volunteer">Volunteer</option>
                            </select>
                        </div>
                    </div>
                </section>

                <div className="flex items-center gap-4 bg-accent-primary/5 border border-accent-primary/20 p-6 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-accent-primary shrink-0" />
                    <p className="text-xs text-foreground/60 leading-relaxed">
                        {isPromoFree
                            ? `By posting this job, you agree to our terms. This listing is FREE during our launch promo (${jobsRemaining} spots left). Normal price is $${PRICES.JOB_POST} USDC after promo ends.`
                            : `By posting this job, you agree to our terms. All listings are subject to verification. Payment of $${PRICES.JOB_POST} USDC is required at checkout.`
                        }
                    </p>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 text-xs font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={uploadingLogo || loading}
                        className="px-12 py-4 bg-foreground text-background font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                    >
                        {isPromoFree ? 'POST FOR FREE' : 'CONTINUE TO PAYMENT'}
                        {isPromoFree ? <Zap className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </form>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handlePaymentConfirm}
                amount={PRICES.JOB_POST}
                description="Job Listing Fee"
                loading={loading}
            />
        </div>
    );
}
