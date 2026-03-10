'use client';

import { use, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { JobPosting } from '@/lib/types';
import {
    Briefcase, MapPin, DollarSign, Clock,
    ArrowLeft, Globe, Twitter, Share2,
    ShieldCheck, Info, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import ApplyModal from '@/components/ApplyModal';
import { useAppContext } from '@/context/AppContext';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, isLoggedIn } = useAppContext();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        async function fetchJob() {
            try {
                const docRef = doc(db, 'jobs', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setJob({
                        id: docSnap.id,
                        ...docSnap.data()
                    } as JobPosting);
                }
            } catch (err) {
                console.error('Error fetching job:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchJob();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Loading Job Details...</p>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Job posting not found</h2>
                <Link href="/jobs" className="text-accent-primary hover:underline">Return to Job Board</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <Link href="/jobs" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors mb-12 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Board</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Job Info */}
                <div className="lg:col-span-2 space-y-12">
                    <header className="glass p-10 border-accent-primary/20 bg-accent-primary/5">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                                {job.logoUrl ? (
                                    <img src={job.logoUrl} alt={job.projectName} className="w-full h-full object-cover" />
                                ) : (
                                    <Briefcase className="w-10 h-10 text-accent-primary" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="font-display font-black text-3xl tracking-tight">{job.roleNeeded}</h1>
                                    <div className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${job.status === 'Open' || (job.status as string) === 'active' ? 'bg-accent-success/20 text-accent-success border-accent-success/30' : 'bg-accent-danger/20 text-accent-danger border-accent-danger/30'}`}>
                                        {job.status === 'Open' || (job.status as string) === 'active' ? 'Active' : job.status}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-foreground/40 text-sm font-bold">
                                    <span className="text-accent-primary uppercase tracking-tighter">{job.projectName}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                                        <MapPin className="w-3 h-3" />
                                        {job.isRemote ? 'Remote' : 'On-site'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/5">
                            <div>
                                <p className="text-[10px] font-bold text-foreground/20 uppercase mb-1">Duration</p>
                                <p className="font-black text-sm">{job.duration}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground/20 uppercase mb-1">Experience</p>
                                <p className="font-black text-sm">{job.experienceLevel}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground/20 uppercase mb-1">Payment</p>
                                <p className="font-black text-sm text-accent-success">{job.paymentConfig.amount} {job.paymentConfig.currency}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground/20 uppercase mb-1">Method</p>
                                <p className="font-black text-sm">{job.paymentConfig.type}</p>
                            </div>
                        </div>
                    </header>

                    <section className="space-y-8">
                        <div className="glass p-10">
                            <h2 className="font-display font-black text-2xl mb-6">Job Description</h2>
                            <p className="text-foreground/70 leading-relaxed text-lg whitespace-pre-wrap">
                                {job.description}
                            </p>
                        </div>

                        <div className="glass p-10">
                            <h2 className="font-display font-black text-2xl mb-6">Details</h2>
                            <ul className="space-y-4">
                                {[
                                    `Experience Level: ${job.experienceLevel}`,
                                    `Duration: ${job.duration}`,
                                    `Location: ${job.isRemote ? 'Remote' : 'On-site'}`,
                                    `Compensation: ${job.paymentConfig.amount} ${job.paymentConfig.currency} (${job.paymentConfig.type})`,
                                ].map((req, i) => (
                                    <li key={i} className="flex items-start gap-4 group">
                                        <CheckCircle2 className="w-5 h-5 text-accent-primary/40 group-hover:text-accent-primary transition-colors shrink-0 mt-0.5" />
                                        <span className="text-foreground/60 group-hover:text-foreground/80 transition-colors">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Sidebar - Apply & Project Info */}
                <aside className="space-y-8">
                    <div className="glass p-8 sticky top-32">
                        <div className="mb-8">
                            <h3 className="font-display font-black text-xl mb-4">Ready to Apply?</h3>
                            <p className="text-xs text-foreground/40 leading-relaxed mb-6">
                                Your CV is auto-attached. Write a short note on why you're the right fit and send it directly to {job.projectName}.
                            </p>
                            {isLoggedIn ? (
                                user?.id === job.postedBy ? (
                                    <p className="text-xs text-foreground/30 font-bold text-center py-3">This is your listing</p>
                                ) : (
                                    <button
                                        onClick={() => setShowApplyModal(true)}
                                        className="w-full py-4 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                                    >
                                        Apply Now
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </button>
                                )
                            ) : (
                                <Link href="/onboarding"
                                    className="w-full py-4 bg-foreground text-background font-black rounded-xl hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest">
                                    Sign In to Apply
                                </Link>
                            )}
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <h4 className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Project Links</h4>
                            <div className="flex flex-col gap-3">
                                <a href={job.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent-primary/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-foreground/40 group-hover:text-accent-primary" />
                                        <span className="text-xs font-bold">Website</span>
                                    </div>
                                    <Share2 className="w-3 h-3 text-foreground/20" />
                                </a>
                                {job.twitter && (
                                    <a href={`https://twitter.com/${job.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent-primary/30 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Twitter className="w-4 h-4 text-foreground/40 group-hover:text-accent-primary" />
                                            <span className="text-xs font-bold">Twitter</span>
                                        </div>
                                        <Share2 className="w-3 h-3 text-foreground/20" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {job.verified && (
                            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-accent-success shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-accent-success mb-1">Verified Project</p>
                                    <p className="text-[10px] text-foreground/40 leading-tight">This project has been verified by the Hub moderators.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {job && (
                <ApplyModal
                    job={job}
                    isOpen={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                />
            )}
        </div>
    );
}
