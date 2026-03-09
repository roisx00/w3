'use client';

import { use, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { TalentProfile } from '@/lib/types';
import ReviewSection from '@/components/ReviewSection';
import {
    Send, Briefcase, Calendar, Award, ChevronLeft, CheckCircle2,
    Copy, Link as LinkIcon, ShieldCheck, MessageSquare, Share2, Zap
} from 'lucide-react';
import Link from 'next/link';

export default function TalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [talent, setTalent] = useState<TalentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedContact, setCopiedContact] = useState(false);

    useEffect(() => {
        async function fetchTalent() {
            try {
                const docRef = doc(db, 'talents', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTalent({ id: docSnap.id, ...docSnap.data() } as TalentProfile);
                }
            } catch (err) {
                console.error('Error fetching talent:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTalent();
    }, [id]);

    const copyProfileLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
    };

    const copyContact = () => {
        navigator.clipboard.writeText(talent?.walletAddress || talent?.email || '');
        setCopiedContact(true);
        setTimeout(() => setCopiedContact(false), 2000);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Loading Resume...</p>
            </div>
        );
    }

    if (!talent) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
                <Link href="/talents" className="text-accent-primary hover:underline">Return to Hub</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <Link href="/talents" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors mb-8 group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Directory</span>
            </Link>

            {/* Share Banner */}
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-accent-primary/20 bg-accent-primary/5">
                <div className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-accent-primary flex-shrink-0" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-foreground/80">This page is your Web3 resume</p>
                        <p className="text-[10px] text-foreground/40 font-medium mt-0.5">Drop this link in your X bio, DMs, or anywhere you apply</p>
                    </div>
                </div>
                <button
                    onClick={copyProfileLink}
                    className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        copiedLink
                            ? 'bg-accent-success/20 border border-accent-success/30 text-accent-success'
                            : 'bg-accent-primary text-white hover:bg-accent-secondary hover:scale-105 active:scale-95'
                    }`}
                >
                    {copiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'Copied!' : 'Copy Resume Link'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="glass p-8 sticky top-32">
                        {/* Avatar + Name */}
                        <div className="text-center mb-8">
                            <div className="w-28 h-28 rounded-3xl bg-accent-primary/20 border-2 border-accent-primary/30 mx-auto mb-5 flex items-center justify-center font-display font-black text-4xl text-accent-primary overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.2)]">
                                {talent.photoUrl ? (
                                    <img src={talent.photoUrl} alt={talent.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    talent.displayName?.charAt(0)
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <h1 className="font-display font-black text-2xl tracking-tight">{talent.displayName}</h1>
                                {talent.verified && <ShieldCheck className="w-5 h-5 text-accent-primary" />}
                            </div>
                            <p className="text-foreground/40 text-sm font-medium mb-1">@{talent.username}</p>
                            {talent.availability && (
                                <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 ${
                                    talent.availability === 'Full-time' ? 'bg-accent-success/10 text-accent-success border border-accent-success/20' :
                                    talent.availability === 'Freelance' ? 'bg-accent-warning/10 text-accent-warning border border-accent-warning/20' :
                                    'bg-white/5 text-foreground/40 border border-white/10'
                                }`}>
                                    {talent.availability}
                                </span>
                            )}
                        </div>

                        {/* Socials */}
                        {(talent.socials?.twitter || talent.socials?.discord || talent.socials?.telegram) && (
                            <div className="flex justify-center gap-3 mb-8">
                                {talent.socials?.twitter && (
                                    <a href={`https://twitter.com/${talent.socials.twitter.replace('@', '')}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="p-2.5 glass-pill hover:bg-white/5 transition-colors text-foreground/50 hover:text-accent-primary border-white/5">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                                    </a>
                                )}
                                {talent.socials?.discord && (
                                    <a href={`https://discord.com/users/${talent.socials.discord}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="p-2.5 glass-pill hover:bg-white/5 transition-colors text-foreground/50 hover:text-accent-primary border-white/5">
                                        <MessageSquare className="w-4 h-4" />
                                    </a>
                                )}
                                {talent.socials?.telegram && (
                                    <a href={`https://t.me/${talent.socials.telegram.replace('@', '')}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="p-2.5 glass-pill hover:bg-white/5 transition-colors text-foreground/50 hover:text-accent-primary border-white/5">
                                        <Send className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Wallet */}
                        {talent.walletAddress && (
                            <div className="flex justify-between items-center py-4 border-t border-white/5">
                                <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Wallet</span>
                                <span className="text-xs font-black text-foreground/60 font-mono">
                                    {talent.walletAddress.slice(0, 6)}...{talent.walletAddress.slice(-4)}
                                </span>
                            </div>
                        )}

                        {/* CTA buttons */}
                        <div className="space-y-3 mt-6">
                            {talent.socials?.twitter ? (
                                <a href={`https://twitter.com/${talent.socials.twitter.replace('@', '')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-widest shadow-[0_8px_24px_rgba(124,58,237,0.3)]">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                                    Contact on X
                                </a>
                            ) : (talent.walletAddress || talent.email) ? (
                                <button onClick={copyContact}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary transition-all text-xs uppercase tracking-widest">
                                    {copiedContact ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copiedContact ? 'Copied!' : 'Copy Contact'}
                                </button>
                            ) : null}

                            <button onClick={copyProfileLink}
                                className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 text-foreground/50 font-bold rounded-xl hover:border-accent-primary/30 hover:text-foreground transition-all text-xs uppercase tracking-widest">
                                <LinkIcon className="w-3.5 h-3.5" />
                                {copiedLink ? 'Link Copied!' : 'Copy Resume Link'}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Bio */}
                    <section className="glass p-8">
                        <h2 className="font-display font-black text-lg uppercase tracking-widest text-foreground/30 mb-4">About</h2>
                        <p className="text-foreground/80 leading-relaxed text-lg">
                            {talent.bio || <span className="italic text-foreground/30">No bio yet.</span>}
                        </p>
                    </section>

                    {/* Roles */}
                    {(talent.roles ?? []).length > 0 && (
                        <section className="glass p-8">
                            <h2 className="font-display font-black text-lg uppercase tracking-widest text-foreground/30 mb-5 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-accent-secondary" /> Expertise
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {(talent.roles ?? []).map(role => (
                                    <span key={role} className="px-4 py-2 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-xs font-black uppercase tracking-widest">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skills */}
                    {(talent.skills ?? []).length > 0 && (
                        <section className="glass p-8">
                            <h2 className="font-display font-black text-lg uppercase tracking-widest text-foreground/30 mb-5 flex items-center gap-2">
                                <Award className="w-4 h-4 text-accent-primary" /> Skills
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {(talent.skills ?? []).map(skill => (
                                    <div key={skill} className="glass-pill px-5 py-2 border-white/5 bg-white/5 hover:border-accent-primary/30 transition-colors flex items-center gap-2 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/40 group-hover:bg-accent-primary transition-colors" />
                                        <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Experience */}
                    <section className="glass p-8">
                        <h2 className="font-display font-black text-lg uppercase tracking-widest text-foreground/30 mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-accent-primary" /> Experience
                        </h2>
                        <div className="space-y-5">
                            {(talent.experience ?? []).length > 0 ? (talent.experience ?? []).map((exp, idx) => (
                                <div key={idx} className="relative pl-6 border-l-2 border-accent-primary/20 hover:border-accent-primary/60 transition-colors group">
                                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-accent-primary/40 group-hover:bg-accent-primary transition-colors" />
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div>
                                            <h3 className="font-black text-base">{exp.role}</h3>
                                            <p className="text-accent-primary font-bold text-sm">{exp.projectName}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-foreground/30 font-bold text-xs bg-white/5 px-3 py-1 rounded-lg border border-white/5 flex-shrink-0">
                                            <Calendar className="w-3 h-3" />
                                            {exp.duration}
                                        </div>
                                    </div>
                                    <p className="text-foreground/60 text-sm leading-relaxed">{exp.responsibilities}</p>
                                </div>
                            )) : (
                                <p className="text-foreground/20 italic text-sm">No experience added yet.</p>
                            )}
                        </div>
                    </section>

                    {/* Reviews & Reputation */}
                    <ReviewSection talentId={id} talentName={talent.displayName} />
                </div>
            </div>
        </div>
    );
}
