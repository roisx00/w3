'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, User, Briefcase, Award, Plus, Trash2, Copy, Share2, Camera, Loader2, Github, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { UserRole, Experience } from '@/lib/types';
import AuthGuard from '@/components/auth/AuthGuard';
import { checkBadgePromo } from '@/lib/promos';
import PaymentModal from '@/components/PaymentModal';
import { PRICES } from '@/lib/payments';
import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const STEPS = [
    { id: 'basic', title: 'Identity', icon: User },
    { id: 'roles', title: 'Expertise', icon: Award },
    { id: 'experience', title: 'History', icon: Briefcase },
    { id: 'socials', title: 'Proofs', icon: Share2 },
];

function OnboardingPage() {
    return (
        <AuthGuard>
            <OnboardingContent />
        </AuthGuard>
    );
}

function OnboardingContent() {
    const router = useRouter();
    const { user, updateProfile } = useAppContext();
    const [currentStep, setCurrentStep] = useState(0);
    const [skillInput, setSkillInput] = useState('');
    const [done, setDone] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [fetchingGithub, setFetchingGithub] = useState(false);
    const [githubError, setGithubError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        bio: '',
        walletAddress: '',
        twitter: '',
        availability: 'Full-time' as 'Full-time' | 'Part-time' | 'Freelance',
        roles: [] as UserRole[],
        skills: [] as string[],
        experience: [] as Experience[],
        photoUrl: '',
        github: '',
        portfolio: '',
        githubStats: undefined as any,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                displayName: user.displayName || '',
                bio: user.bio || '',
                walletAddress: user.walletAddress || '',
                twitter: user.socials?.twitter || '',
                availability: user.availability || 'Full-time',
                roles: user.roles || [],
                skills: user.skills || [],
                experience: user.experience || [],
                photoUrl: user.photoUrl || '',
                github: user.socials?.github || '',
                portfolio: user.socials?.portfolio || '',
                githubStats: user.githubStats,
            });
        }
    }, [user?.id]);


    const fetchGithubStats = async () => {
        if (!formData.github.trim()) return;
        setFetchingGithub(true);
        setGithubError(null);
        try {
            const res = await fetch(`https://api.github.com/users/${formData.github}`);
            if (!res.ok) throw new Error('User not found');
            const data = await res.json();
            
            setFormData(prev => ({
                ...prev,
                githubStats: {
                    repos: data.public_repos || 0,
                    followers: data.followers || 0,
                    stars: 0, // Total stars is harder to get via public API without multiple calls
                    verifiedAt: new Date().toISOString(),
                }
            }));
        } catch (err) {
            setGithubError('GitHub user not found or API limit reached');
        } finally {
            setFetchingGithub(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5MB.'); return; }
        setUploadingPhoto(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            if (!res.ok) throw new Error('Upload failed');
            const { url } = await res.json();
            setFormData(prev => ({ ...prev, photoUrl: url }));
        } catch {
            alert('Failed to upload photo. Please try again.');
        } finally {
            setUploadingPhoto(false);
            e.target.value = '';
        }
    };

    const validate = (): string[] => {
        if (currentStep === 0) {
            const e: string[] = [];
            if (!formData.username.trim()) e.push('Username is required');
            if (!formData.displayName.trim()) e.push('Display name is required');
            if (!formData.bio.trim()) e.push('Bio is required');
            return e;
        }
        if (currentStep === 1) {
            const e: string[] = [];
            if (formData.roles.length === 0) e.push('Select at least one role');
            if (formData.skills.length === 0) e.push('Add at least one skill');
            return e;
        }
        if (currentStep === 2) {
            if (formData.experience.length === 0) return ['Add at least one experience entry'];
            const incomplete = formData.experience.some(e => !e.projectName.trim() || !e.role.trim() || !e.duration.trim());
            if (incomplete) return ['Fill in Project, Role, and Duration for all entries'];
        }
        if (currentStep === 3) {
            // Step 3 is optional, no required fields
            return [];
        }
        return [];
    };

    const handleNext = () => {
        const errs = validate();
        if (errs.length > 0) { setErrors(errs); return; }
        setErrors([]);
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            publish();
        }
    };

    const publish = (hasBadgeOverride = false) => {
        updateProfile({
            username: formData.username,
            displayName: formData.displayName,
            bio: formData.bio,
            walletAddress: formData.walletAddress,
            availability: formData.availability,
            socials: {
                ...(user?.socials || {}),
                twitter: formData.twitter || undefined,
                github: formData.github || undefined,
                portfolio: formData.portfolio || undefined,
            },
            githubStats: formData.githubStats,
            roles: formData.roles,
            skills: formData.skills,
            experience: formData.experience,
            ...(formData.photoUrl ? { photoUrl: formData.photoUrl } : {}),
            ...(hasBadgeOverride ? { hasBadge: true } : {}),
        } as any);
        setDone(true);
    };

    const handleBadgePayment = async (txHash: string) => {
        if (!user?.id) return;
        setPaymentLoading(true);
        try {
            // 1. Record payment
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
            // 2. Update talent doc
            await updateDoc(doc(db, 'talents', user.id), { hasBadge: true, badgeTxHash: txHash });
            
            // 3. Finalize profile and show done screen
            setShowBadgeModal(false);
            publish(true);
        } catch (err) {
            alert('Failed to activate badge. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) { setErrors([]); setCurrentStep(currentStep - 1); }
    };

    const toggleRole = (role: UserRole) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role],
        }));
    };

    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            experience: [...prev.experience, {
                id: Date.now().toString(),
                projectName: '',
                role: '',
                duration: '',
                responsibilities: '',
            }],
        }));
    };

    const updateExperience = (id: string, field: keyof Experience, value: string) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.map(e => e.id === id ? { ...e, [field]: value } : e),
        }));
    };

    const removeExperience = (id: string) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.filter(e => e.id !== id),
        }));
    };

    const profileUrl = user?.id ? `${typeof window !== 'undefined' ? window.location.origin : ''}/talents/${user.id}` : '';

    const copyLink = () => {
        if (profileUrl) {
            navigator.clipboard.writeText(profileUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    // Done screen
    if (done) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-20 text-center">
                <div className="glass p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="w-20 h-20 rounded-3xl bg-accent-success/10 border-2 border-accent-success/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-accent-success" />
                    </div>
                    <h2 className="font-display font-black text-4xl mb-3 tracking-tight">You're live.</h2>
                    <p className="text-foreground/50 mb-10 text-base">
                        Your Web3 resume is published. Share the link anywhere — X bio, DMs, job applications.
                    </p>

                    {/* Share link box */}
                    <div className="flex items-center gap-3 glass bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-4">
                        <span className="flex-1 text-sm font-mono text-foreground/60 truncate text-left">{profileUrl}</span>
                        <button
                            onClick={copyLink}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${copiedLink
                                    ? 'bg-accent-success/20 border border-accent-success/30 text-accent-success'
                                    : 'bg-accent-primary text-white hover:bg-accent-secondary'
                                }`}
                        >
                            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedLink ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/20 mb-10 flex items-center justify-center gap-2">
                        <Share2 className="w-3 h-3" /> Paste this in your X bio for instant visibility
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href={profileUrl}
                            className="px-8 py-3.5 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary transition-all text-xs uppercase tracking-widest"
                        >
                            View My Resume
                        </a>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-8 py-3.5 border border-white/10 text-foreground/50 font-black rounded-xl hover:border-white/20 hover:text-foreground transition-all text-xs uppercase tracking-widest"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-20">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-16 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === currentStep;
                    const isCompleted = idx < currentStep;
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${isActive ? 'bg-accent-primary border-accent-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] scale-110' :
                                    isCompleted ? 'bg-accent-success/20 border-accent-success text-accent-success' :
                                        'bg-background border-white/10 text-foreground/40'
                                }`}>
                                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${isActive ? 'text-accent-primary' : 'text-foreground/40'}`}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="glass p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/10 rounded-full blur-[60px] -mr-16 -mt-16" />

                {/* Step 0: Identity */}
                {currentStep === 0 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="font-display text-3xl font-extrabold mb-6">Tell us about <span className="text-accent-primary">yourself.</span></h2>
                        <div className="space-y-6">
                            {/* Profile Photo Upload */}
                            <div className="flex flex-col items-center gap-3 pb-4 border-b border-white/5">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Profile Photo</label>
                                <label className="relative cursor-pointer group">
                                    <div className="w-24 h-24 rounded-full bg-accent-primary/20 border-2 border-accent-primary/30 flex items-center justify-center overflow-hidden font-display font-black text-3xl text-accent-primary transition-all group-hover:border-accent-primary/60">
                                        {formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            formData.displayName?.charAt(0)?.toUpperCase() || <User className="w-10 h-10 opacity-40" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {uploadingPhoto
                                                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                : <Camera className="w-6 h-6 text-white" />
                                            }
                                        </div>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                                </label>
                                <p className="text-[10px] text-foreground/30 font-medium">Click to upload · PNG, JPG · max 5MB</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Username</label>
                                <input type="text" value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    placeholder="vitalik_eth"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium rounded-2xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Display Name</label>
                                <input type="text" value={formData.displayName}
                                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="Vitalik Buterin"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium rounded-2xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Bio</label>
                                <textarea rows={4} value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell the community what you're passionate about..."
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium resize-none rounded-2xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Wallet Address</label>
                                <input type="text" value={formData.walletAddress}
                                    onChange={e => setFormData({ ...formData, walletAddress: e.target.value })}
                                    placeholder="0x... or yourname.eth"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium rounded-2xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Twitter / X Handle</label>
                                <input type="text" value={formData.twitter}
                                    onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                                    placeholder="@username"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium rounded-2xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Availability</label>
                                <select value={formData.availability}
                                    onChange={e => setFormData({ ...formData, availability: e.target.value as any })}
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium rounded-2xl">
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Freelance">Freelance</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Expertise */}
                {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="font-display text-3xl font-extrabold mb-2">What's your <span className="text-accent-secondary">alpha?</span></h2>
                        <p className="text-foreground/40 text-sm mb-8">Select the roles you excel at. You can pick multiple.</p>
                        <div className="grid grid-cols-2 gap-4">
                            {(['Developer', 'Ambassador', 'Community Manager', 'Designer', 'Marketing', 'Researcher', 'Moderator', 'Project Manager', 'Founder'] as UserRole[]).map(role => (
                                <button key={role} onClick={() => toggleRole(role)}
                                    className={`px-6 py-4 rounded-xl border-2 text-left font-bold transition-all ${formData.roles.includes(role)
                                            ? 'bg-accent-secondary/10 border-accent-secondary text-accent-secondary shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                            : 'bg-white/5 border-white/5 text-foreground/40 hover:border-white/10'
                                        }`}>
                                    {role}
                                </button>
                            ))}
                        </div>
                        <div className="mt-8">
                            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3 px-1">Skills</label>
                            <div className="flex gap-2 mb-3">
                                <input type="text" value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={e => {
                                        if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                                            e.preventDefault();
                                            const skill = skillInput.trim().replace(/,$/, '');
                                            if (skill && !formData.skills.includes(skill)) {
                                                setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                                            }
                                            setSkillInput('');
                                        }
                                    }}
                                    placeholder="Type a skill and press Enter (e.g. Solidity, Discord, SEO)"
                                    className="flex-grow glass bg-white/5 border-white/10 px-4 py-3 focus:border-accent-primary/50 outline-none transition-colors font-medium text-sm rounded-xl" />
                                <button type="button"
                                    onClick={() => {
                                        const skill = skillInput.trim();
                                        if (skill && !formData.skills.includes(skill)) {
                                            setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                                        }
                                        setSkillInput('');
                                    }}
                                    className="px-4 py-3 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-bold text-xs rounded-xl hover:bg-accent-primary/20 transition-colors">
                                    Add
                                </button>
                            </div>
                            {formData.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.skills.map(skill => (
                                        <span key={skill}
                                            onClick={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}
                                            className="px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold rounded-lg cursor-pointer hover:bg-accent-danger/10 hover:border-accent-danger/20 hover:text-accent-danger transition-colors">
                                            {skill} ✕
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Experience */}
                {currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                        <div>
                            <h2 className="font-display text-3xl font-extrabold mb-1">Proof of <span className="text-accent-success">Work.</span></h2>
                            <p className="text-foreground/40 text-sm">Add your Web3 experience — this becomes your live resume.</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Work Experience</label>
                            <button type="button" onClick={addExperience}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent-primary hover:scale-105 transition-all">
                                <Plus className="w-3 h-3" /> Add Entry
                            </button>
                        </div>
                        {formData.experience.length === 0 ? (
                            <button type="button" onClick={addExperience}
                                className="w-full border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-accent-primary/30 transition-colors text-foreground/30 text-sm font-bold">
                                + Add your first experience
                            </button>
                        ) : (
                            <div className="space-y-4">
                                {formData.experience.map(exp => (
                                    <div key={exp.id} className="glass p-6 space-y-4 relative">
                                        <button type="button" onClick={() => removeExperience(exp.id)}
                                            className="absolute top-4 right-4 p-1.5 text-foreground/20 hover:text-accent-danger transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Project / Company</label>
                                                <input type="text" value={exp.projectName}
                                                    onChange={e => updateExperience(exp.id, 'projectName', e.target.value)}
                                                    placeholder="Uniswap Labs"
                                                    className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium rounded-xl" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Your Role</label>
                                                <input type="text" value={exp.role}
                                                    onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                                                    placeholder="Community Manager"
                                                    className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium rounded-xl" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Duration</label>
                                            <input type="text" value={exp.duration}
                                                onChange={e => updateExperience(exp.id, 'duration', e.target.value)}
                                                placeholder="Jan 2023 – Present"
                                                className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Responsibilities</label>
                                            <textarea rows={2} value={exp.responsibilities}
                                                onChange={e => updateExperience(exp.id, 'responsibilities', e.target.value)}
                                                placeholder="What did you build or manage?"
                                                className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium resize-none rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Social Proofs */}
                {currentStep === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="mb-8">
                            <h2 className="font-display text-3xl font-extrabold mb-1">Social <span className="text-accent-primary">Proofs.</span></h2>
                            <p className="text-foreground/40 text-sm">Verify your influence and link your portfolio. <span className="text-accent-primary/60 italic">(Optional)</span></p>
                        </div>

                        <div className="space-y-8">
                            {/* GitHub Verification */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-accent-primary/10 transition-colors" />
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-white/10">
                                        <Github className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">GitHub Verification</h3>
                                        <p className="text-[10px] text-foreground/40 font-medium tracking-wide uppercase">Influence & Code Contributions</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" 
                                            value={formData.github}
                                            onChange={e => setFormData({ ...formData, github: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
                                            placeholder="GitHub Username"
                                            className="w-full glass bg-white/5 border-white/10 px-5 py-3.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium rounded-xl"
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={fetchGithubStats}
                                        disabled={fetchingGithub || !formData.github.trim()}
                                        className="px-6 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {fetchingGithub ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        {formData.githubStats ? 'Refresh' : 'Verify'}
                                    </button>
                                </div>

                                {githubError && <p className="text-[10px] text-accent-danger font-bold mt-2 px-1">{githubError}</p>}

                                {formData.githubStats && (
                                    <div className="mt-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                            <p className="text-xl font-black text-white">{formData.githubStats.repos}</p>
                                            <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">Repos</p>
                                        </div>
                                        <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                            <p className="text-xl font-black text-accent-success">{formData.githubStats.followers}</p>
                                            <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">Followers</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-accent-success/10 border border-accent-success/30 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-accent-success" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Portfolio Link */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/5 group">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center border border-accent-secondary/20">
                                        <Globe className="w-6 h-6 text-accent-secondary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">Personal Portfolio</h3>
                                        <p className="text-[10px] text-foreground/40 font-medium tracking-wide uppercase">Website or Case Studies</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                                    <input 
                                        type="text" 
                                        value={formData.portfolio}
                                        onChange={e => setFormData({ ...formData, portfolio: e.target.value })}
                                        placeholder="https://yourportfolio.com"
                                        className="w-full glass bg-white/5 border-white/10 pl-12 pr-5 py-3.5 focus:border-accent-secondary/50 outline-none transition-colors text-sm font-medium rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-4 border border-accent-primary/20 bg-accent-primary/5 rounded-xl flex gap-3">
                            <Sparkles className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-foreground/60 leading-relaxed">
                                <span className="font-bold text-accent-primary uppercase">Alpha Tip:</span> Verified proofs significantly increase your <span className="font-bold text-white">Resume Score</span> and catch the eye of top Founders looking for contributors.
                            </p>
                        </div>
                    </div>
                )}

                {/* Validation Errors */}
                {errors.length > 0 && (
                    <div className="mt-8 px-5 py-4 rounded-xl border border-accent-danger/30 bg-accent-danger/5 space-y-1">
                        {errors.map((err, i) => (
                            <p key={i} className="text-xs font-bold text-accent-danger flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-accent-danger flex-shrink-0" />
                                {err}
                            </p>
                        ))}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
                    <button onClick={handleBack} disabled={currentStep === 0}
                        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-opacity ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-foreground/40 hover:text-foreground'
                            }`}>
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={handleNext}
                        className="px-10 py-4 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(124,58,237,0.3)]">
                        {currentStep === STEPS.length - 1 ? 'Publish Resume' : 'Continue'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <PaymentModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                onConfirm={handleBadgePayment}
                amount={PRICES.USER_BADGE}
                description="Access Badge (Required for Hub)"
                loading={paymentLoading}
            />
        </div>
    );
}

export default OnboardingPage;
