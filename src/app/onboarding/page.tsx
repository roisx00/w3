'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, User, Briefcase, Award, Plus, Trash2, Lock } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { UserRole, Experience } from '@/lib/types';
import AuthGuard from '@/components/auth/AuthGuard';
import PaymentModal from '@/components/PaymentModal';
import { db } from '@/lib/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { PRICES } from '@/lib/payments';

const STEPS = [
    { id: 'basic', title: 'Identity', icon: User },
    { id: 'roles', title: 'Expertise', icon: Award },
    { id: 'experience', title: 'History', icon: Briefcase },
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
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [skillInput, setSkillInput] = useState('');
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [badgeLoading, setBadgeLoading] = useState(false);
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
        resumeUrl: '',
    });

    // Pre-fill from existing profile
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
                resumeUrl: user.resumeUrl || '',
            });
        }
    }, [user?.id]);

    const doUpload = async (file: File) => {
        setUploading(true);
        setUploadProgress(10);
        try {
            const data = new FormData();
            data.append('file', file);

            setUploadProgress(30);
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            setUploadProgress(90);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const { url } = await res.json();
            setFormData(prev => ({ ...prev, resumeUrl: url }));
            setUploadProgress(100);
        } catch (error) {
            console.error('Error uploading resume:', error);
            alert('Error uploading resume. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file only.');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File must be under 5MB.');
            e.target.value = '';
            return;
        }

        // Badge gate: require $2 badge to upload resume
        if (!user?.hasBadge && !user?.hasBadgePending) {
            setPendingFile(file);
            setShowBadgeModal(true);
            e.target.value = '';
            return;
        }

        await doUpload(file);
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

            // Update local user state so badge gate is unlocked immediately
            updateProfile({ hasBadgePending: true, badgeTxHash: txHash } as any);

            setShowBadgeModal(false);

            // Auto-upload the pending file
            if (pendingFile) {
                await doUpload(pendingFile);
                setPendingFile(null);
            }
        } catch (err) {
            console.error('Badge payment error:', err);
            alert('Failed to submit badge payment. Please try again.');
        } finally {
            setBadgeLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            await updateProfile({
                username: formData.username,
                displayName: formData.displayName,
                bio: formData.bio,
                walletAddress: formData.walletAddress,
                availability: formData.availability,
                socials: {
                    ...(user?.socials || {}),
                    twitter: formData.twitter || undefined,
                },
                roles: formData.roles,
                skills: formData.skills,
                experience: formData.experience,
                resumeUrl: formData.resumeUrl,
            } as any);
            router.push('/dashboard');
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const toggleRole = (role: UserRole) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role]
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
            }]
        }));
    };

    const updateExperience = (id: string, field: keyof Experience, value: string) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
        }));
    };

    const removeExperience = (id: string) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.filter(e => e.id !== id)
        }));
    };

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
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${isActive ? 'bg-accent-primary border-accent-primary text-background shadow-[0_0_20px_rgba(0,242,255,0.4)] scale-110' :
                                isCompleted ? 'bg-accent-success/20 border-accent-success text-accent-success' :
                                    'bg-background border-white/10 text-foreground/40'
                                }`}>
                                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${isActive ? 'text-accent-primary' : 'text-foreground/40'
                                }`}>{step.title}</span>
                        </div>
                    );
                })}
            </div>

            <div className="glass p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/10 rounded-full blur-[60px] -mr-16 -mt-16" />

                {currentStep === 0 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="font-display text-3xl font-extrabold mb-6">Tell us about <span className="text-accent-primary">yourself.</span></h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="vitalik.eth"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="Vitalik Buterin"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Bio</label>
                                <textarea
                                    rows={4}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell the community what you're passionate about..."
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Wallet Address</label>
                                <input
                                    type="text"
                                    value={formData.walletAddress}
                                    onChange={e => setFormData({ ...formData, walletAddress: e.target.value })}
                                    placeholder="0x... or yourname.eth"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Twitter / X Handle</label>
                                <input
                                    type="text"
                                    value={formData.twitter}
                                    onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                                    placeholder="@username"
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1">Availability</label>
                                <select
                                    value={formData.availability}
                                    onChange={e => setFormData({ ...formData, availability: e.target.value as any })}
                                    className="w-full glass bg-white/5 border-white/10 px-6 py-4 focus:border-accent-primary/50 outline-none transition-colors font-medium"
                                >
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Freelance">Freelance</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="font-display text-3xl font-extrabold mb-2">What's your <span className="text-accent-secondary">alpha?</span></h2>
                        <p className="text-foreground/40 text-sm mb-8">Select the roles you excel at. You can pick multiple.</p>

                        <div className="grid grid-cols-2 gap-4">
                            {(['Developer', 'Ambassador', 'Community Manager', 'Designer', 'Marketing', 'Researcher', 'Moderator', 'Project Manager'] as UserRole[]).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => toggleRole(role)}
                                    className={`px-6 py-4 rounded-xl border-2 text-left font-bold transition-all ${formData.roles.includes(role)
                                        ? 'bg-accent-secondary/10 border-accent-secondary text-accent-secondary shadow-[0_0_15px_rgba(255,0,229,0.2)]'
                                        : 'bg-white/5 border-white/5 text-foreground/40 hover:border-white/10'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8">
                            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3 px-1">Skills</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={skillInput}
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
                                    className="flex-grow glass bg-white/5 border-white/10 px-4 py-3 focus:border-accent-primary/50 outline-none transition-colors font-medium text-sm rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const skill = skillInput.trim();
                                        if (skill && !formData.skills.includes(skill)) {
                                            setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                                        }
                                        setSkillInput('');
                                    }}
                                    className="px-4 py-3 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-bold text-xs rounded-xl hover:bg-accent-primary/20 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {formData.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.skills.map(skill => (
                                        <span
                                            key={skill}
                                            onClick={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}
                                            className="px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold rounded-lg cursor-pointer hover:bg-accent-danger/10 hover:border-accent-danger/20 hover:text-accent-danger transition-colors"
                                        >
                                            {skill} ✕
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                        <div>
                            <h2 className="font-display text-3xl font-extrabold mb-2">Proof of <span className="text-accent-success">Work.</span></h2>
                            <p className="text-foreground/40 text-sm mb-8">Add your experience and upload your resume.</p>
                        </div>

                        {/* Experience Entries */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Work Experience</label>
                                <button
                                    type="button"
                                    onClick={addExperience}
                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent-primary hover:scale-105 transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Add Entry
                                </button>
                            </div>

                            {formData.experience.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={addExperience}
                                    className="w-full border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-accent-primary/30 transition-colors text-foreground/30 text-sm font-bold"
                                >
                                    + Add your first experience
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    {formData.experience.map((exp) => (
                                        <div key={exp.id} className="glass p-6 space-y-4 relative">
                                            <button
                                                type="button"
                                                onClick={() => removeExperience(exp.id)}
                                                className="absolute top-4 right-4 p-1.5 text-foreground/20 hover:text-accent-danger transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Project / Company</label>
                                                    <input
                                                        type="text"
                                                        value={exp.projectName}
                                                        onChange={e => updateExperience(exp.id, 'projectName', e.target.value)}
                                                        placeholder="Uniswap Labs"
                                                        className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium rounded-xl"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Your Role</label>
                                                    <input
                                                        type="text"
                                                        value={exp.role}
                                                        onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                                                        placeholder="Community Manager"
                                                        className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Duration</label>
                                                <input
                                                    type="text"
                                                    value={exp.duration}
                                                    onChange={e => updateExperience(exp.id, 'duration', e.target.value)}
                                                    placeholder="Jan 2023 – Present"
                                                    className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1.5">Responsibilities</label>
                                                <textarea
                                                    rows={2}
                                                    value={exp.responsibilities}
                                                    onChange={e => updateExperience(exp.id, 'responsibilities', e.target.value)}
                                                    placeholder="What did you build or manage?"
                                                    className="w-full glass bg-white/5 border-white/10 px-4 py-2.5 focus:border-accent-primary/50 outline-none transition-colors text-sm font-medium resize-none rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Resume Upload */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest">Resume (PDF)</label>
                                {user?.hasBadge ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent-success">
                                        <CheckCircle2 className="w-3 h-3" /> Badge Active
                                    </span>
                                ) : user?.hasBadgePending ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent-warning">
                                        <Lock className="w-3 h-3" /> Badge Pending Verification
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/30">
                                        <Lock className="w-3 h-3" /> Requires ${PRICES.USER_BADGE} Badge
                                    </span>
                                )}
                            </div>
                            <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-accent-success/50 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 border-4 border-accent-success border-t-transparent rounded-full mx-auto animate-spin" />
                                        <p className="font-bold text-foreground/60 text-sm">Uploading... {uploadProgress}%</p>
                                        <div className="w-full bg-white/10 rounded-full h-1.5">
                                            <div className="bg-accent-success h-1.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                ) : formData.resumeUrl ? (
                                    <div className="space-y-2">
                                        <CheckCircle2 className="w-10 h-10 text-accent-success mx-auto" />
                                        <p className="font-bold text-accent-success text-sm">Resume Uploaded!</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Click to change</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Sparkles className="w-10 h-10 text-accent-success/40 mx-auto group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-foreground/60 text-sm">Upload Resume (PDF, max 5MB)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-opacity ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-foreground/40 hover:text-foreground'
                            }`}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                        onClick={handleNext}
                        className="px-10 py-4 bg-foreground text-background font-black rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                    >
                        {currentStep === STEPS.length - 1 ? 'Go Live' : 'Continue'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        <PaymentModal
            isOpen={showBadgeModal}
            onClose={() => { setShowBadgeModal(false); setPendingFile(null); }}
            onConfirm={handleBadgePayment}
            amount={PRICES.USER_BADGE}
            description="Access Badge (One-time)"
            loading={badgeLoading}
        />
        </div>
    );
}

export default OnboardingPage;
