'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import { Review } from '@/lib/types';
import { Star, MessageSquarePlus, Trash2, Loader2, ShieldAlert } from 'lucide-react';

interface ReviewSectionProps {
    talentId: string;
    talentName: string;
}

function Stars({ rating, interactive = false, onSelect }: {
    rating: number;
    interactive?: boolean;
    onSelect?: (r: number) => void;
}) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onSelect?.(n)}
                    onMouseEnter={() => interactive && setHover(n)}
                    onMouseLeave={() => interactive && setHover(0)}
                    className={`transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
                >
                    <Star
                        className={`w-4 h-4 transition-colors ${
                            n <= (hover || rating)
                                ? 'fill-accent-warning text-accent-warning'
                                : 'text-foreground/20'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

function scoreLabel(score: number) {
    if (score >= 85) return { label: 'Excellent', color: 'text-accent-success' };
    if (score >= 70) return { label: 'Good', color: 'text-accent-primary' };
    if (score >= 50) return { label: 'Average', color: 'text-accent-warning' };
    return { label: 'Poor', color: 'text-accent-danger' };
}

export default function ReviewSection({ talentId, talentName }: ReviewSectionProps) {
    const { user, isLoggedIn } = useAppContext();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const isOwnProfile = user?.id === talentId;
    const hasReviewed = reviews.some(r => r.reviewerId === user?.id);
    const canReview = isLoggedIn && !isOwnProfile && !hasReviewed && user?.hasBadge;

    const score = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length / 5) * 100)
        : null;

    useEffect(() => {
        async function fetchReviews() {
            try {
                const snap = await getDocs(collection(db, 'talents', talentId, 'reviews'));
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
                data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
                setReviews(data);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        }
        fetchReviews();
    }, [talentId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (rating === 0) { setError('Please select a star rating.'); return; }
        if (text.trim().length < 10) { setError('Review must be at least 10 characters.'); return; }
        setError('');
        setSubmitting(true);
        try {
            const reviewData = {
                reviewerId: user!.id,
                reviewerName: user!.displayName,
                reviewerPhotoUrl: user!.photoUrl || '',
                reviewerUsername: user!.username || '',
                rating,
                text: text.trim(),
                createdAt: serverTimestamp(),
            };
            // Use reviewerId as doc ID → enforces one review per person
            await setDoc(doc(db, 'talents', talentId, 'reviews', user!.id), reviewData);

            const newReview: Review = { id: user!.id, ...reviewData, createdAt: { seconds: Date.now() / 1000 } };
            const updated = [newReview, ...reviews];
            setReviews(updated);

            // Update score on talent doc for quick display
            const newScore = Math.round((updated.reduce((s, r) => s + r.rating, 0) / updated.length / 5) * 100);
            await updateDoc(doc(db, 'talents', talentId), {
                reputationScore: newScore,
                reviewCount: updated.length,
            });

            setShowForm(false);
            setRating(0);
            setText('');
        } catch (err: any) {
            setError(err.message || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Delete your review?')) return;
        try {
            await deleteDoc(doc(db, 'talents', talentId, 'reviews', reviewId));
            const updated = reviews.filter(r => r.id !== reviewId);
            setReviews(updated);
            const newScore = updated.length > 0
                ? Math.round((updated.reduce((s, r) => s + r.rating, 0) / updated.length / 5) * 100)
                : null;
            await updateDoc(doc(db, 'talents', talentId), {
                reputationScore: newScore ?? 0,
                reviewCount: updated.length,
            });
        } catch {
            alert('Failed to delete review.');
        }
    };

    return (
        <section className="glass p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="font-display font-black text-lg uppercase tracking-widest text-foreground/30">
                        Reviews
                    </h2>
                    {score !== null && !loading && (
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-black ${scoreLabel(score).color}`}>{score}</span>
                            <span className="text-foreground/30 font-bold text-sm">/100</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${scoreLabel(score).color}`}>
                                · {scoreLabel(score).label}
                            </span>
                        </div>
                    )}
                    {reviews.length > 0 && (
                        <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {canReview && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-colors"
                    >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        Write Review
                    </button>
                )}
            </div>

            {/* Write review prompt for non-badge users */}
            {isLoggedIn && !isOwnProfile && !hasReviewed && !user?.hasBadge && (
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl mb-6 text-xs text-foreground/40">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Get your <strong className="text-foreground/60">Access Badge</strong> to leave reviews on talent profiles.</span>
                </div>
            )}

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 glass bg-white/5 p-6 rounded-2xl space-y-4 border border-accent-primary/20">
                    <p className="text-xs font-black uppercase tracking-widest text-accent-primary">Your Review of {talentName}</p>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Rating</label>
                        <Stars rating={rating} interactive onSelect={setRating} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Your feedback</label>
                        <textarea
                            rows={3}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Share your experience working with this person — work quality, communication, reliability..."
                            className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none text-sm font-medium resize-none transition-all"
                        />
                    </div>

                    {error && <p className="text-xs font-bold text-accent-danger">{error}</p>}

                    <div className="flex gap-3">
                        <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                            className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all disabled:opacity-50">
                            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Submit Review
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="flex items-center gap-2 text-foreground/30 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews...
                </div>
            ) : reviews.length === 0 ? (
                <p className="text-foreground/20 italic text-sm">No reviews yet. Be the first to vouch for {talentName}.</p>
            ) : (
                <div className="space-y-5">
                    {reviews.map(review => (
                        <div key={review.id} className="flex gap-4 pb-5 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary text-sm shrink-0 overflow-hidden">
                                {review.reviewerPhotoUrl
                                    ? <img src={review.reviewerPhotoUrl} alt={review.reviewerName} className="w-full h-full object-cover" />
                                    : review.reviewerName?.charAt(0)
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{review.reviewerName}</span>
                                        {review.reviewerUsername && (
                                            <span className="text-[10px] text-foreground/30">@{review.reviewerUsername}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Stars rating={review.rating} />
                                        {user?.id === review.reviewerId && (
                                            <button onClick={() => handleDelete(review.id)}
                                                className="p-1 text-foreground/20 hover:text-accent-danger transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-foreground/60 leading-relaxed">{review.text}</p>
                                {review.createdAt?.seconds && (
                                    <p className="text-[10px] text-foreground/20 mt-1">
                                        {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
