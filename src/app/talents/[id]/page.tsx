'use client';

import { use, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { TalentProfile } from '@/lib/types';
import {
    Twitter, Send, Github, Globe, MapPin,
    Briefcase, Calendar, Award, ChevronLeft, CheckCircle2,
    Copy, ExternalLink, ShieldCheck, FileText, Link as LinkIcon, MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function TalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [talent, setTalent] = useState<TalentProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTalent() {
            try {
                const docRef = doc(db, 'talents', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTalent({
                        id: docSnap.id,
                        ...docSnap.data()
                    } as TalentProfile);
                }
            } catch (err) {
                console.error('Error fetching talent:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTalent();
    }, [id]);

    const [copied, setCopied] = useState(false);

    const copyResumeLink = () => {
        if (talent?.resumeUrl) {
            navigator.clipboard.writeText(talent.resumeUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Loading Talent Profile...</p>
            </div>
        );
    }

    if (!talent) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Talent not found</h2>
                <Link href="/talents" className="text-accent-primary hover:underline">Return to Hub</Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <Link href="/talents" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors mb-12 group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Directory</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Sidebar - Profile Summary */}
                <aside className="lg:col-span-4 space-y-8">
                    <div className="glass p-8 sticky top-32">
                        <div className="text-center mb-8">
                            <div className="w-32 h-32 rounded-3xl bg-accent-primary/20 border-2 border-accent-primary/30 mx-auto mb-6 flex items-center justify-center font-display font-black text-4xl text-accent-primary overflow-hidden shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                                {talent.photoUrl ? (
                                    <img src={talent.photoUrl} alt={talent.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    talent.displayName.charAt(0)
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <h1 className="font-display font-black text-3xl tracking-tight">{talent.displayName}</h1>
                                {talent.verified && <ShieldCheck className="w-5 h-5 text-accent-primary" />}
                            </div>
                            <p className="text-foreground/40 font-medium mb-6">@{talent.username}</p>

                            <div className="flex justify-center gap-4">
                                {talent.socials?.twitter && (
                                    <a
                                        href={`https://twitter.com/${talent.socials.twitter.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 glass-pill hover:bg-white/5 transition-colors text-foreground/60 hover:text-accent-primary"
                                    >
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                )}
                                {talent.socials?.discord && (
                                    <a
                                        href={`https://discord.com/users/${talent.socials.discord}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 glass-pill hover:bg-white/5 transition-colors text-foreground/60 hover:text-accent-primary"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </a>
                                )}
                                {talent.socials?.telegram && (
                                    <a
                                        href={`https://t.me/${talent.socials.telegram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 glass-pill hover:bg-white/5 transition-colors text-foreground/60 hover:text-accent-primary"
                                    >
                                        <Send className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {talent.resumeUrl && (
                            <div className="space-y-4 pt-8 border-t border-white/5 mx-auto">
                                <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest block mb-4">Professional Resume</span>
                                <div className="flex gap-2">
                                    <a
                                        href={talent.resumeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 glass-pill py-3 flex items-center justify-center gap-2 hover:bg-accent-primary/5 transition-all group"
                                    >
                                        <FileText className="w-4 h-4 text-accent-primary" />
                                        <span className="text-xs font-bold">View</span>
                                    </a>
                                    <button
                                        onClick={copyResumeLink}
                                        className="flex-1 glass-pill py-3 flex items-center justify-center gap-2 hover:bg-accent-secondary/5 transition-all group"
                                    >
                                        {copied ? (
                                            <CheckCircle2 className="w-4 h-4 text-accent-success" />
                                        ) : (
                                            <LinkIcon className="w-4 h-4 text-accent-secondary" />
                                        )}
                                        <span className="text-xs font-bold">{copied ? 'Copied!' : 'Copy Link'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 pt-8 mt-8 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Availability</span>
                                <span className="text-xs font-black text-accent-success uppercase">{talent.availability}</span>
                            </div>
                            {talent.walletAddress && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Network</span>
                                    <span className="text-xs font-black text-foreground/80 lowercase">{talent.walletAddress.slice(0, 6)}...{talent.walletAddress.slice(-4)}</span>
                                </div>
                            )}
                        </div>

                        {talent.socials?.twitter ? (
                            <a
                                href={`https://twitter.com/${talent.socials.twitter.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full mt-10 py-4 bg-accent-primary text-background font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,242,255,0.2)] text-center"
                            >
                                CONTACT ON X
                            </a>
                        ) : (talent.walletAddress || talent.email) ? (
                            <button
                                onClick={() => navigator.clipboard.writeText(talent.walletAddress || talent.email || '')}
                                className="w-full mt-10 py-4 bg-accent-primary text-background font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,242,255,0.2)]"
                            >
                                COPY CONTACT
                            </button>
                        ) : null}
                    </div>
                </aside>

                {/* Right Main Content */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Bio Section */}
                    <section className="glass p-10">
                        <h2 className="font-display font-black text-2xl mb-6">About</h2>
                        <p className="text-foreground/70 leading-relaxed text-lg italic">
                            "{talent.bio}"
                        </p>
                    </section>

                    {/* Skills Grid */}
                    {(talent.skills ?? []).length > 0 && (
                        <section>
                            <h2 className="font-display font-black text-2xl mb-8 flex items-center gap-3">
                                <Award className="w-6 h-6 text-accent-secondary" />
                                Core Competencies
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {(talent.skills ?? []).map((skill) => (
                                    <div key={skill} className="glass-pill px-6 py-3 border-white/5 bg-white/5 hover:border-accent-primary/30 transition-colors flex items-center gap-3 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/40 group-hover:bg-accent-primary" />
                                        <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Experience Timeline */}
                    <section>
                        <h2 className="font-display font-black text-2xl mb-8 flex items-center gap-3">
                            <Briefcase className="w-6 h-6 text-accent-primary" />
                            Professional History
                        </h2>
                        <div className="space-y-6">
                            {(talent.experience ?? []).length > 0 ? (talent.experience ?? []).map((exp, idx) => (
                                <div key={idx} className="glass p-8 border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xl font-black mb-1">{exp.role}</h3>
                                            <p className="text-accent-primary font-bold text-sm uppercase tracking-tighter">{exp.projectName}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground/40 font-bold text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Calendar className="w-3 h-3" />
                                            {exp.duration}
                                        </div>
                                    </div>

                                    <p className="text-foreground/60 leading-relaxed text-sm">
                                        {exp.responsibilities}
                                    </p>
                                </div>
                            )) : (
                                <div className="glass p-12 text-center border-dashed border-white/10">
                                    <p className="text-foreground/20 italic">No experience added yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
