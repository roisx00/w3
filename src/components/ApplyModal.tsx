'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import { X, Send, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { JobPosting } from '@/lib/types';

interface ApplyModalProps {
    job: JobPosting;
    isOpen: boolean;
    onClose: () => void;
}

export default function ApplyModal({ job, isOpen, onClose }: ApplyModalProps) {
    const { user, isLoggedIn } = useAppContext();
    const [coverNote, setCoverNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const cvLink = user?.id
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://w3hub.space'}/talents/${user.id}`
        : '';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!coverNote.trim()) { setError('Please write why you are a good fit.'); return; }
        if (!user?.id) return;
        setError('');
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'applications'), {
                jobId: job.id,
                jobTitle: job.roleNeeded,
                projectName: job.projectName,
                posterId: job.postedBy || '',
                applicantId: user.id,
                applicantName: user.displayName || '',
                applicantUsername: user.username || '',
                applicantPhotoUrl: user.photoUrl || '',
                cvLink,
                coverNote: coverNote.trim(),
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setDone(true);
        } catch {
            setError('Failed to send application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setCoverNote('');
        setDone(false);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative glass max-w-lg w-full p-8 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-1">Apply for Position</p>
                        <h2 className="text-xl font-black uppercase">{job.roleNeeded}</h2>
                        <p className="text-foreground/40 text-sm font-medium">{job.projectName}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 text-foreground/20 hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {done ? (
                    <div className="text-center py-8 space-y-4">
                        <CheckCircle2 className="w-14 h-14 text-accent-success mx-auto" />
                        <h3 className="text-xl font-black uppercase">Application Sent!</h3>
                        <p className="text-foreground/50 text-sm">Your application has been delivered to {job.projectName}. Good luck!</p>
                        <button onClick={handleClose}
                            className="px-8 py-3 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all">
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* CV Link - auto-attached */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-accent-success/5 border border-accent-success/20 rounded-xl">
                            <FileText className="w-4 h-4 text-accent-success shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent-success mb-0.5">Your CV — Auto Attached</p>
                                <p className="text-xs font-mono text-foreground/50 truncate">{cvLink}</p>
                            </div>
                        </div>

                        {/* Cover note */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                                Why are you a great fit for this role?
                            </label>
                            <textarea
                                rows={5}
                                value={coverNote}
                                onChange={e => setCoverNote(e.target.value)}
                                placeholder={`Tell ${job.projectName} why you're the right person — your relevant experience, skills, and why this role excites you...`}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none text-sm font-medium resize-none transition-all"
                            />
                            <p className="text-[10px] text-foreground/20">{coverNote.length} chars</p>
                        </div>

                        {error && <p className="text-xs font-bold text-accent-danger">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={handleClose}
                                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting || !coverNote.trim()}
                                className="flex-1 py-3 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                {submitting ? 'Sending...' : 'Send Application'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
