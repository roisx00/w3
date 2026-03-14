'use client';

import { useState } from 'react';
import { TalentProfile } from '@/lib/types';
import ReviewSection from '@/components/ReviewSection';
import GoldBadge from '@/components/GoldBadge';
import FounderBadge from '@/components/FounderBadge';
import {
    Send, Briefcase, Calendar, Award, ChevronLeft, CheckCircle2,
    Copy, Link as LinkIcon, ShieldCheck, MessageSquare, Share2, Zap,
    FileText, Download, Star, Code2, Users,
    Sparkles, Clock, Eye, Bookmark
} from 'lucide-react';
import Link from 'next/link';

interface TalentProfileViewProps {
    talent: TalentProfile;
    id: string;
    currentUser: any;
    savedResumes: string[];
    toggleSaveResume: (id: string) => void;
}

export default function TalentProfileView({ talent, id, currentUser, savedResumes, toggleSaveResume }: TalentProfileViewProps) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedContact, setCopiedContact] = useState(false);

    const isSaved = savedResumes.includes(id);
    const isFounder = currentUser?.roles?.includes('Founder');

    const copyProfileLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
    };

    const copyContact = () => {
        navigator.clipboard.writeText(talent.walletAddress || talent.email || '');
        setCopiedContact(true);
        setTimeout(() => setCopiedContact(false), 2000);
    };

    const score = talent.reputationScore ?? talent.profileScore ?? null;
    const totalYearsExp = (talent.experience ?? []).reduce((acc, e) => {
        const match = e.duration?.match(/(\d+)/);
        return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <Link href="/talents" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors mb-8 group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Directory</span>
            </Link>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <aside className="lg:col-span-4 space-y-5">
                    <div className="glass p-7 sticky top-32 space-y-6">
                        {/* Avatar + Name */}
                        <div className="text-center">
                            <div className="relative inline-block mb-4">
                                <div className="w-28 h-28 rounded-3xl bg-accent-primary/20 border-2 border-accent-primary/30 flex items-center justify-center font-display font-black text-4xl text-accent-primary overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.2)]">
                                    {talent.photoUrl ? (
                                        <img src={talent.photoUrl} alt={talent.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        talent.displayName?.charAt(0)
                                    )}
                                </div>
                                {talent.hasBadge && (
                                    <div className="absolute -bottom-2 -right-2">
                                        <GoldBadge size={28} />
                                    </div>
                                )}
                                {talent.isFounderVerified && (
                                    <div className="absolute -top-1 -right-1">
                                        <FounderBadge size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-0.5">
                                <h1 className="font-display font-black text-2xl tracking-tight">{talent.displayName}</h1>
                                {talent.verified && (
                                    <span title="Verified Professional">
                                        <ShieldCheck className="w-5 h-5 text-accent-primary flex-shrink-0" />
                                    </span>
                                )}
                                {talent.isFounderVerified && <FounderBadge size={20} className="flex-shrink-0" />}
                            </div>
                            <p className="text-foreground/40 text-sm font-medium mb-3">@{talent.username}</p>

                            {/* Status badges */}
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {talent.views !== undefined && (
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 text-foreground/40 border border-white/10 flex items-center gap-1.5" title="Total profile views">
                                        <Eye className="w-3 h-3" />
                                        {talent.views} Views
                                    </span>
                                )}
                                {talent.availability && (
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                        talent.availability === 'Full-time' ? 'bg-accent-success/10 text-accent-success border border-accent-success/20' :
                                        talent.availability === 'Freelance' ? 'bg-accent-warning/10 text-accent-warning border border-accent-warning/20' :
                                        'bg-white/5 text-foreground/40 border border-white/10'
                                    }`}>
                                        {talent.availability}
                                    </span>
                                )}
                                {talent.openToWork && (
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-accent-success/10 text-accent-success border border-accent-success/30 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                                        Open to Work
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Resume Score */}
                        {score !== null && score > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-accent-warning" /> Resume Score
                                    </p>
                                    <span className={`text-lg font-black ${
                                        score >= 90 ? 'text-accent-success' :
                                        score >= 80 ? 'text-accent-primary' :
                                        score >= 70 ? 'text-accent-warning' : 'text-accent-danger'
                                    }`}>{score}<span className="text-foreground/30 text-xs font-bold">/100</span></span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${
                                            score >= 90 ? 'bg-accent-success shadow-[0_0_8px_rgba(0,255,136,0.5)]' :
                                            score >= 80 ? 'bg-accent-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]' :
                                            score >= 70 ? 'bg-accent-warning' : 'bg-accent-danger'
                                        }`}
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-foreground/30 font-medium mt-1.5">
                                    {talent.reviewCount && talent.reviewCount > 0
                                        ? `${talent.reviewCount} peer review${talent.reviewCount !== 1 ? 's' : ''} · adjusts with feedback`
                                        : 'Based on profile quality · improves with reviews'}
                                </p>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                <p className="text-xl font-black text-accent-primary">{(talent.skills ?? []).length}</p>
                                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-wide mt-0.5">Skills</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                <p className="text-xl font-black text-accent-secondary">{(talent.experience ?? []).length}</p>
                                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-wide mt-0.5">Projects</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                <p className="text-xl font-black text-accent-warning">{talent.reviewCount ?? 0}</p>
                                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-wide mt-0.5">Reviews</p>
                            </div>
                        </div>

                        {/* Socials */}
                        {(talent.socials?.twitter || talent.socials?.discord || talent.socials?.telegram) && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Connect</p>
                                <div className="flex gap-2">
                                    {talent.socials?.twitter && (
                                        <a href={`https://twitter.com/${talent.socials.twitter.replace('@', '')}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 p-2.5 glass-pill hover:bg-white/5 transition-colors text-foreground/50 hover:text-accent-primary border-white/5 text-[10px] font-bold">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                                            X / Twitter
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
                            </div>
                        )}

                        {/* Wallet */}
                        {talent.walletAddress && (
                            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-1">Wallet Address</p>
                                <p className="text-xs font-black text-foreground/60 font-mono tracking-wider">
                                    {talent.walletAddress.slice(0, 8)}...{talent.walletAddress.slice(-6)}
                                </p>
                            </div>
                        )}

                        {/* CTA buttons */}
                        <div className="space-y-2 pt-1">
                            {talent.socials?.twitter ? (
                                <a href={`https://twitter.com/${talent.socials.twitter.replace('@', '')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-widest shadow-[0_8px_24px_rgba(124,58,237,0.3)]">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                                    Hire on X
                                </a>
                            ) : (talent.walletAddress || talent.email) ? (
                                <button onClick={copyContact}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary transition-all text-xs uppercase tracking-widest">
                                    {copiedContact ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copiedContact ? 'Copied!' : 'Copy Contact'}
                                </button>
                            ) : null}

                            {talent.resumeUrl && (
                                <a href={talent.resumeUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 border border-accent-success/30 text-accent-success font-black rounded-xl hover:bg-accent-success/10 transition-all text-xs uppercase tracking-widest">
                                    <Download className="w-3.5 h-3.5" />
                                    Download Resume PDF
                                </a>
                            )}

                            {isFounder && (
                                <button
                                    onClick={() => toggleSaveResume(id)}
                                    className={`flex items-center justify-center gap-2 w-full py-3 border rounded-xl transition-all text-xs uppercase tracking-widest font-black ${
                                        isSaved
                                            ? 'bg-accent-secondary text-white border-accent-secondary shadow-[0_8px_24px_rgba(168,85,247,0.3)]'
                                            : 'border-accent-secondary/30 text-accent-secondary hover:bg-accent-secondary/10'
                                    }`}
                                >
                                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                    {isSaved ? 'Resume Saved' : 'Save Resume'}
                                </button>
                            )}

                            <button onClick={copyProfileLink}
                                className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 text-foreground/50 font-bold rounded-xl hover:border-accent-primary/30 hover:text-foreground transition-all text-xs uppercase tracking-widest">
                                <LinkIcon className="w-3.5 h-3.5" />
                                {copiedLink ? 'Link Copied!' : 'Copy Resume Link'}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Bio + Roles combined hero section */}
                    <section className="glass p-8 space-y-6">
                        <div>
                            <h2 className="font-display font-black text-xs uppercase tracking-[0.2em] text-foreground/30 mb-3 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> About
                            </h2>
                            <p className="text-foreground/80 leading-relaxed text-base">
                                {talent.bio || <span className="italic text-foreground/30">No bio yet.</span>}
                            </p>
                        </div>

                        {(talent.roles ?? []).length > 0 && (
                            <div>
                                <h2 className="font-display font-black text-xs uppercase tracking-[0.2em] text-foreground/30 mb-3 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-accent-secondary" /> Expertise
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {(talent.roles ?? []).map(role => (
                                        <span key={role} className="px-4 py-2 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-xs font-black uppercase tracking-widest">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Skills */}
                    {(talent.skills ?? []).length > 0 && (
                        <section className="glass p-8">
                            <h2 className="font-display font-black text-xs uppercase tracking-[0.2em] text-foreground/30 mb-5 flex items-center gap-2">
                                <Code2 className="w-3.5 h-3.5 text-accent-primary" /> Skills & Tools
                                <span className="ml-auto text-[10px] font-bold text-foreground/20 normal-case tracking-normal">
                                    {(talent.skills ?? []).length} total
                                </span>
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {(talent.skills ?? []).map((skill, idx) => (
                                    <div key={skill} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-default ${
                                        idx < 3
                                            ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                                            : 'bg-white/5 border-white/10 text-foreground/60 hover:border-accent-primary/20 hover:text-foreground/80'
                                    }`}>
                                        {idx < 3 && <Sparkles className="w-3 h-3 inline mr-1 opacity-70" />}
                                        {skill}
                                    </div>
                                ))}
                            </div>
                            {(talent.skills ?? []).length > 3 && (
                                <p className="text-[10px] text-foreground/20 mt-3 font-medium">
                                    Top 3 highlighted · +{(talent.skills ?? []).length - 3} more skills
                                </p>
                            )}
                        </section>
                    )}

                    {/* Experience */}
                    <section className="glass p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-display font-black text-xs uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-accent-primary" /> Work Experience
                            </h2>
                            {totalYearsExp > 0 && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">
                                    {totalYearsExp}+ yrs
                                </span>
                            )}
                        </div>
                        <div className="space-y-6">
                            {(talent.experience ?? []).length > 0 ? (talent.experience ?? []).map((exp, idx) => (
                                <div key={idx} className="relative pl-6 border-l-2 border-accent-primary/20 hover:border-accent-primary/50 transition-colors group">
                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-accent-primary/40 group-hover:bg-accent-primary transition-colors" />
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                        <div>
                                            <h3 className="font-black text-base leading-tight">{exp.role}</h3>
                                            <p className="text-accent-primary font-bold text-sm mt-0.5">{exp.projectName}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-foreground/40 font-bold text-[10px] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex-shrink-0 self-start">
                                            <Clock className="w-3 h-3" />
                                            {exp.duration}
                                        </div>
                                    </div>
                                    {exp.responsibilities && (
                                        <p className="text-foreground/60 text-sm leading-relaxed">{exp.responsibilities}</p>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
                                    <Briefcase className="w-8 h-8 text-foreground/10 mx-auto mb-2" />
                                    <p className="text-foreground/20 italic text-sm">No experience added yet.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Resume PDF CTA */}
                    {talent.resumeUrl && (
                        <section className="glass p-6 border border-accent-success/20 bg-accent-success/5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-success/10 border border-accent-success/20 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-accent-success" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-wide">Full Resume Available</p>
                                        <p className="text-foreground/40 text-xs font-medium mt-0.5">PDF · Verified via W3Hub</p>
                                    </div>
                                </div>
                                <a href={talent.resumeUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-accent-success text-background font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex-shrink-0">
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </a>
                            </div>
                        </section>
                    )}

                    {/* Reviews & Reputation */}
                    <ReviewSection talentId={id} talentName={talent.displayName} profileScore={talent.profileScore ?? 0} />
                </div>
            </div>
        </div>
    );
}
