'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Zap, Send, Check, Loader2, Megaphone, ChevronDown } from 'lucide-react';

const CAMPAIGN_TYPES = ['Tweet / Post', 'Thread', 'YouTube Review', 'X Spaces / AMA', 'Newsletter Feature', 'Telegram Blast', 'Multiple Formats'];
const NICHES = ['DeFi', 'NFTs', 'Gaming', 'Layer 2', 'AI x Crypto', 'Memes', 'Infrastructure', 'DAOs', 'Trading', 'Education', 'General Crypto'];
const BUDGETS = ['< $500', '$500 – $2K', '$2K – $10K', '$10K – $50K', '$50K+', 'Open to Discuss'];
const TIMELINES = ['ASAP (this week)', '1–2 Weeks', '1 Month', 'Flexible'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    prefilledKOL?: string; // KOL display name if opened from a KOL profile
}

export default function HireKOLModal({ isOpen, onClose, prefilledKOL }: Props) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        projectName: '',
        twitter: '',
        telegram: '',
        description: '',
        campaignType: '',
        targetNiches: [] as string[],
        budget: '',
        timeline: '',
        specificKOL: prefilledKOL || '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const set = (k: keyof typeof form, v: string) => {
        setForm(p => ({ ...p, [k]: v }));
        setErrors(p => ({ ...p, [k]: '' }));
    };

    const toggleNiche = (n: string) => {
        setForm(p => ({
            ...p,
            targetNiches: p.targetNiches.includes(n)
                ? p.targetNiches.filter(x => x !== n)
                : [...p.targetNiches, n],
        }));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.projectName.trim()) e.projectName = 'Required';
        if (!form.twitter.trim() && !form.telegram.trim()) e.twitter = 'At least one contact method is required';
        if (!form.description.trim()) e.description = 'Required';
        if (!form.campaignType) e.campaignType = 'Required';
        if (!form.budget) e.budget = 'Required';
        if (!form.timeline) e.timeline = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'kol_proposals'), {
                projectName: form.projectName.trim(),
                twitter: form.twitter.trim().replace('@', ''),
                telegram: form.telegram.trim().replace('@', ''),
                description: form.description.trim(),
                campaignType: form.campaignType,
                targetNiches: form.targetNiches,
                budget: form.budget,
                timeline: form.timeline,
                specificKOL: form.specificKOL.trim(),
                notes: form.notes.trim(),
                status: 'new',
                createdAt: serverTimestamp(),
            });
            setStep('success');
        } catch (err) {
            console.error(err);
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep('form');
        setForm({ projectName: '', twitter: '', telegram: '', description: '', campaignType: '', targetNiches: [], budget: '', timeline: '', specificKOL: prefilledKOL || '', notes: '' });
        setErrors({});
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass border border-white/10 rounded-3xl shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-background/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest">Hire a KOL</p>
                            <p className="text-[10px] text-foreground/30 font-bold">W3Hub will match you with the right KOL</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <X className="w-4 h-4 text-foreground/40" />
                    </button>
                </div>

                {step === 'success' ? (
                    /* Success State */
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-6">
                            <Check className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="font-black text-2xl uppercase tracking-tight mb-2">Proposal Sent!</h3>
                        <p className="text-foreground/40 text-sm max-w-sm mb-2">
                            We've received your proposal for <span className="text-foreground/70 font-bold">{form.projectName}</span>.
                        </p>
                        <p className="text-foreground/30 text-xs mb-8">
                            Our team will review it and reach out to you via{' '}
                            {form.twitter ? `@${form.twitter} on X` : `@${form.telegram} on Telegram`} within 24–48 hours.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/20">
                            <Megaphone className="w-3 h-3" />
                            W3Hub KOL Matchmaking
                        </div>
                        <button onClick={handleClose} className="mt-8 px-6 py-2.5 glass border border-white/10 text-sm font-black uppercase tracking-widest rounded-xl hover:border-white/20 transition-colors">
                            Close
                        </button>
                    </div>
                ) : (
                    /* Form */
                    <div className="px-8 py-6 space-y-6">

                        {/* Project basics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                    Project Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. BasePad, ZkDAO..."
                                    value={form.projectName}
                                    onChange={e => set('projectName', e.target.value)}
                                    className={`w-full px-4 py-3 glass border rounded-xl text-sm placeholder:text-foreground/20 outline-none transition-colors focus:border-accent-primary/40 ${errors.projectName ? 'border-red-500/40' : 'border-white/10'}`}
                                />
                                {errors.projectName && <p className="text-[10px] text-red-400 mt-1">{errors.projectName}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                    Project Website
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://yourproject.xyz"
                                    value={form.notes}
                                    onChange={e => set('notes', e.target.value)}
                                    className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-sm placeholder:text-foreground/20 outline-none focus:border-accent-primary/40 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                Your Contact <span className="text-red-400">*</span>
                                <span className="text-foreground/20 ml-2 normal-case font-bold">at least one</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 font-mono text-sm">𝕏</span>
                                    <input
                                        type="text"
                                        placeholder="@yourhandle"
                                        value={form.twitter}
                                        onChange={e => set('twitter', e.target.value)}
                                        className={`w-full pl-8 pr-4 py-3 glass border rounded-xl text-sm placeholder:text-foreground/20 outline-none transition-colors focus:border-accent-primary/40 ${errors.twitter ? 'border-red-500/40' : 'border-white/10'}`}
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-bold">TG</span>
                                    <input
                                        type="text"
                                        placeholder="@yourhandle"
                                        value={form.telegram}
                                        onChange={e => set('telegram', e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 glass border border-white/10 rounded-xl text-sm placeholder:text-foreground/20 outline-none focus:border-accent-primary/40 transition-colors"
                                    />
                                </div>
                            </div>
                            {errors.twitter && <p className="text-[10px] text-red-400 mt-1">{errors.twitter}</p>}
                        </div>

                        {/* Project description */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                About Your Project <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="What does your project do? What stage are you at? What's the goal of this campaign?"
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                className={`w-full px-4 py-3 glass border rounded-xl text-sm placeholder:text-foreground/20 outline-none resize-none transition-colors focus:border-accent-primary/40 ${errors.description ? 'border-red-500/40' : 'border-white/10'}`}
                            />
                            {errors.description && <p className="text-[10px] text-red-400 mt-1">{errors.description}</p>}
                        </div>

                        {/* Campaign type + Budget + Timeline */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                    Campaign Type <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={form.campaignType}
                                        onChange={e => set('campaignType', e.target.value)}
                                        className={`w-full px-4 py-3 glass border rounded-xl text-sm appearance-none outline-none transition-colors focus:border-accent-primary/40 bg-transparent ${errors.campaignType ? 'border-red-500/40' : 'border-white/10'} ${!form.campaignType ? 'text-foreground/30' : ''}`}
                                    >
                                        <option value="">Select type</option>
                                        {CAMPAIGN_TYPES.map(t => <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                                </div>
                                {errors.campaignType && <p className="text-[10px] text-red-400 mt-1">{errors.campaignType}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                    Budget Range <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={form.budget}
                                        onChange={e => set('budget', e.target.value)}
                                        className={`w-full px-4 py-3 glass border rounded-xl text-sm appearance-none outline-none transition-colors focus:border-accent-primary/40 bg-transparent ${errors.budget ? 'border-red-500/40' : 'border-white/10'} ${!form.budget ? 'text-foreground/30' : ''}`}
                                    >
                                        <option value="">Select budget</option>
                                        {BUDGETS.map(b => <option key={b} value={b} className="bg-[#0a0a0f]">{b}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                                </div>
                                {errors.budget && <p className="text-[10px] text-red-400 mt-1">{errors.budget}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                    Timeline <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={form.timeline}
                                        onChange={e => set('timeline', e.target.value)}
                                        className={`w-full px-4 py-3 glass border rounded-xl text-sm appearance-none outline-none transition-colors focus:border-accent-primary/40 bg-transparent ${errors.timeline ? 'border-red-500/40' : 'border-white/10'} ${!form.timeline ? 'text-foreground/30' : ''}`}
                                    >
                                        <option value="">Select timeline</option>
                                        {TIMELINES.map(t => <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                                </div>
                                {errors.timeline && <p className="text-[10px] text-red-400 mt-1">{errors.timeline}</p>}
                            </div>
                        </div>

                        {/* Target niches */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                Target Audience Niche
                                <span className="text-foreground/20 ml-2 normal-case font-bold">select all that apply</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {NICHES.map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => toggleNiche(n)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                                            form.targetNiches.includes(n)
                                                ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-primary'
                                                : 'bg-white/3 border-white/10 text-foreground/40 hover:border-white/20 hover:text-foreground/60'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Specific KOL */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                                Specific KOL in Mind?
                                <span className="text-foreground/20 ml-2 normal-case font-bold">optional — leave blank and we'll match you</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. CryptoKaleo, Ansem..."
                                value={form.specificKOL}
                                onChange={e => set('specificKOL', e.target.value)}
                                className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-sm placeholder:text-foreground/20 outline-none focus:border-accent-primary/40 transition-colors"
                            />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/5" />

                        {/* Fine print */}
                        <p className="text-[10px] text-foreground/20 leading-relaxed">
                            By submitting you agree that W3Hub will review your proposal and connect you with a suitable KOL. Our team responds within <span className="text-foreground/40 font-bold">24–48 hours</span> via your provided contact. No payment is required at this stage.
                        </p>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-accent-primary to-purple-500 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending Proposal...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Proposal to W3Hub
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
