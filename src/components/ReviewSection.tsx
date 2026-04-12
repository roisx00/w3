'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, setDoc, deleteDoc, serverTimestamp, updateDoc, doc
} from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import { Review } from '@/lib/types';
import { Star, MessageSquarePlus, Trash2, Loader2, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import { PAYMENT_WALLET, BASE_CHAIN_ID } from '@/lib/payments';

interface ReviewSectionProps {
    talentId: string;
    talentName: string;
    profileScore?: number;
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
                    <Star className={`w-4 h-4 transition-colors ${n <= (hover || rating) ? 'fill-accent-warning text-accent-warning' : 'text-foreground/20'}`} />
                </button>
            ))}
        </div>
    );
}

function scoreLabel(score: number) {
    if (score >= 90) return { label: 'Excellent', color: 'text-accent-success' };
    if (score >= 80) return { label: 'Good', color: 'text-accent-primary' };
    if (score >= 70) return { label: 'Average', color: 'text-accent-warning' };
    return { label: 'Needs Work', color: 'text-accent-danger' };
}

export default function ReviewSection({ talentId, talentName, profileScore = 0 }: ReviewSectionProps) {
    const { user, isLoggedIn } = useAppContext();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const isOwnProfile = user?.id === talentId;
    const hasReviewed = reviews.some(r => r.reviewerId === user?.id);
    const canReview = isLoggedIn && !isOwnProfile && !hasReviewed;

    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
    const reviewAdjustment = avgRating !== null ? Math.round(((avgRating - 3) / 2) * 20) : null;
    const score = profileScore > 0 || reviewAdjustment !== null
        ? Math.min(100, Math.max(0, profileScore + (reviewAdjustment ?? 0)))
        : null;

    useEffect(() => {
        getDocs(collection(db, 'talents', talentId, 'reviews'))
            .then(snap => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
                data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
                setReviews(data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [talentId]);

    const handleFormSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (rating === 0) { setError('Please select a star rating.'); return; }
        if (text.trim().length < 10) { setError('Review must be at least 10 characters.'); return; }
        if (!(window as any).ethereum) { setError('MetaMask not found. Please install MetaMask to submit a review.'); return; }
        setError('');
        setSubmitting(true);
        try {
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            await (window as any).ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
            }).catch(() => {});
            const ethersProvider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await ethersProvider.getSigner();
            const tx = await signer.sendTransaction({
                to: PAYMENT_WALLET,
                value: BigInt(0),
            });
            await saveReview(tx.hash);
        } catch (e: any) {
            const msg = e?.message || '';
            if (msg.includes('insufficient') || msg.includes('funds')) {
                setError('Insufficient ETH for gas. Add a small amount of ETH on Base to your wallet.');
            } else if (msg.includes('rejected') || msg.includes('denied')) {
                setError('Transaction rejected.');
            } else {
                setError('Failed to submit review. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const saveReview = async (txHash: string) => {
        try {
            const twitterUsername = user!.socials?.twitter?.replace('@', '') || user!.username || '';
            const reviewData = {
                reviewerId: user!.id,
                reviewerName: user!.displayName,
                reviewerPhotoUrl: user!.photoUrl || '',
                reviewerUsername: twitterUsername,
                rating,
                text: text.trim(),
                txHash,
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'talents', talentId, 'reviews', user!.id), reviewData);

            const newReview: Review = { id: user!.id, ...reviewData, createdAt: { seconds: Date.now() / 1000 } };
            const updated = [newReview, ...reviews];
            setReviews(updated);

            const avgR = updated.reduce((s, r) => s + r.rating, 0) / updated.length;
            const reviewPart = Math.round(((avgR - 3) / 2) * 20);
            await updateDoc(doc(db, 'talents', talentId), {
                reputationScore: Math.min(100, Math.max(0, profileScore + reviewPart)),
                reviewCount: updated.length,
            });

            setShowForm(false);
            setRating(0);
            setText('');
        } catch (err: any) {
            setError(err.message || 'Failed to save review.');
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Delete your review?')) return;
        try {
            await deleteDoc(doc(db, 'talents', talentId, 'reviews', reviewId));
            const updated = reviews.filter(r => r.id !== reviewId);
            setReviews(updated);
            const newScore = updated.length > 0
                ? (() => { const avg = updated.reduce((s, r) => s + r.rating, 0) / updated.length; return Math.min(100, Math.max(0, profileScore + Math.round(((avg - 3) / 2) * 20))); })()
                : profileScore || 0;
            await updateDoc(doc(db, 'talents', talentId), { reputationScore: newScore, reviewCount: updated.length });
        } catch {
            alert('Failed to delete review.');
        }
    };

    return (
        <section className="glass p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="font-display font-black text-lg uppercase tracking-widest text-foreground/30">Reviews</h2>
                    {score !== null && !loading && (
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-black ${scoreLabel(score).color}`}>{score}</span>
                            <span className="text-foreground/30 font-bold text-sm">/100</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${scoreLabel(score).color}`}>· {scoreLabel(score).label}</span>
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

            {/* On-chain info banner */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-6">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <p className="text-[10px] font-bold text-foreground/40">
                    Reviews are <span className="text-emerald-400">on-chain verified</span> — free, but requires a tiny Base gas fee (~$0.001). Your X identity is public.
                </p>
            </div>

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleFormSubmit} className="mb-8 glass bg-white/5 p-6 rounded-2xl space-y-4 border border-accent-primary/20">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-accent-primary">Your Review of {talentName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold">
                            <Zap className="w-3 h-3 text-emerald-400" />
                            Free · gas only (~$0.001)
                        </div>
                    </div>

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
                            placeholder="Share your experience — work quality, communication, reliability..."
                            className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none text-sm font-medium resize-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-accent-primary/20 flex-shrink-0">
                            {user?.photoUrl && <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-foreground/60">{user?.displayName}</p>
                            <p className="text-[9px] text-foreground/30">@{user?.socials?.twitter?.replace('@', '') || user?.username} · shown publicly on review</p>
                        </div>
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
                            {submitting ? 'Signing on-chain...' : 'Submit Review'}
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
                                    : review.reviewerName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm">{review.reviewerName}</span>
                                        {review.reviewerUsername && (
                                            <a
                                                href={`https://x.com/${review.reviewerUsername}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-accent-primary/60 hover:text-accent-primary transition-colors flex items-center gap-0.5"
                                            >
                                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                                                </svg>
                                                @{review.reviewerUsername}
                                            </a>
                                        )}
                                        {/* On-chain proof badge */}
                                        {(review as any).txHash && (
                                            <a
                                                href={`https://basescan.org/tx/${(review as any).txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[9px] font-bold text-emerald-400/70 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                                            >
                                                <ShieldCheck className="w-2.5 h-2.5" />
                                                On-chain
                                                <ExternalLink className="w-2 h-2" />
                                            </a>
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
