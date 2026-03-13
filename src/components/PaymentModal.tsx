'use client';

import { useState } from 'react';
import { Copy, Check, X, Wallet, AlertCircle, ExternalLink, Loader2, ShieldCheck, ShieldX, Sparkles, PartyPopper } from 'lucide-react';
import { PAYMENT_WALLET, BASE_CHAIN_NAME, BASE_EXPLORER_TX } from '@/lib/payments';
import GoldBadge from './GoldBadge';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (txHash: string) => Promise<void> | void;
    amount: number;
    description: string;
    loading?: boolean;
}

type VerifyState = 'idle' | 'verifying' | 'verified' | 'failed' | 'celebrating';

export default function PaymentModal({ isOpen, onClose, onConfirm, amount, description, loading }: PaymentModalProps) {
    const [txHash, setTxHash] = useState('');
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [verifyState, setVerifyState] = useState<VerifyState>('idle');
    const [verifyError, setVerifyError] = useState('');

    if (!isOpen) return null;

    const isValidHash = /^0x[a-fA-F0-9]{64}$/.test(txHash.trim());

    const copyAddress = async () => {
        await navigator.clipboard.writeText(PAYMENT_WALLET);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async () => {
        if (!isValidHash) return;
        setSubmitting(true);
        setVerifyState('verifying');
        setVerifyError('');

        try {
            // Step 1: Verify on-chain via BaseScan
            const res = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash: txHash.trim(), expectedAmount: amount }),
            });
            const data = await res.json();

            if (!data.valid) {
                setVerifyState('failed');
                setVerifyError(data.error || 'Verification failed. Please check your transaction.');
                return;
            }

            // Step 2: Chain verified — activate the perk
            setVerifyState('verified');
            await onConfirm(txHash.trim());
            
            // Step 3: Show celebration!
            setVerifyState('celebrating');
            setTxHash('');
        } catch {
            setVerifyState('failed');
            setVerifyError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (verifyState === 'verified' || verifyState === 'celebrating') return; // don't close mid-activation/celebration
        setVerifyState('idle');
        setVerifyError('');
        setTxHash('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative glass max-w-md w-full p-8 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                
                {verifyState === 'celebrating' ? (
                    <div className="flex flex-col items-center text-center space-y-8 py-4">
                        {/* Animated Badge Container */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent-primary/20 blur-[60px] animate-pulse rounded-full" />
                            <div className="relative bg-gradient-to-tr from-accent-primary/20 to-accent-success/20 p-6 rounded-full border border-white/10 shadow-2xl animate-in zoom-in-50 duration-700 delay-100">
                                <GoldBadge size={140} className="drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-bounce-slow" />
                                <div className="absolute -top-4 -right-4 p-3 bg-accent-primary text-white rounded-2xl shadow-xl animate-bounce">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="absolute -bottom-2 -left-4 p-2.5 bg-accent-success text-white rounded-xl shadow-xl animate-pulse">
                                    <PartyPopper className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-primary mb-2">Verified</p>
                                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                                    Successfully <br /> 
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">Verified</span>
                                </h1>
                            </div>
                            <p className="text-sm font-bold text-foreground/40 max-w-[280px] mx-auto">
                                YOU ARE SUCCESSFULLY VERIFIED ON W3HUB
                            </p>
                        </div>

                        <div className="w-full pt-4 animate-in fade-in duration-700 delay-500">
                            <button
                                onClick={() => { setVerifyState('idle'); onClose(); }}
                                className="w-full py-4 bg-foreground text-background font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20"
                            >
                                Enter The Hub
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-1">Payment Required</p>
                                <h2 className="text-xl font-black uppercase">{description}</h2>
                            </div>
                            <button onClick={handleClose} className="p-2 text-foreground/20 hover:text-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="text-center py-4 bg-accent-success/5 border border-accent-success/20 rounded-2xl">
                            <p className="text-5xl font-black text-accent-success">${amount}</p>
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">USDC on Base Mainnet</p>
                        </div>

                        {/* Send To */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Send USDC to this address
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-[11px] font-mono text-accent-primary bg-accent-primary/5 px-3 py-2 rounded-lg break-all">
                                    {PAYMENT_WALLET}
                                </code>
                                <button
                                    onClick={copyAddress}
                                    className="p-2.5 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors shrink-0"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-foreground/30 font-medium">
                                Network: <span className="text-foreground/50 font-bold">{BASE_CHAIN_NAME}</span> &nbsp;•&nbsp; Token: <span className="text-foreground/50 font-bold">USDC</span>
                            </p>
                        </div>

                        {/* TX Hash */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                                Transaction Hash (after sending)
                            </label>
                            <input
                                type="text"
                                value={txHash}
                                onChange={e => { setTxHash(e.target.value); setVerifyState('idle'); setVerifyError(''); }}
                                placeholder="0x..."
                                disabled={submitting || verifyState === 'verified'}
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-success/50 outline-none transition-all font-mono text-xs disabled:opacity-50"
                            />
                            {isValidHash && verifyState === 'idle' && (
                                <a
                                    href={`${BASE_EXPLORER_TX}${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-accent-primary hover:underline"
                                >
                                    <ExternalLink className="w-3 h-3" /> View on BaseScan
                                </a>
                            )}

                            {/* Verification status */}
                            {verifyState === 'verifying' && (
                                <div className="flex items-center gap-2 text-[11px] font-bold text-accent-primary">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Verifying on Base chain...
                                </div>
                            )}
                            {verifyState === 'verified' && (
                                <div className="flex items-center gap-2 text-[11px] font-bold text-accent-success">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Verified on-chain — activating your perk...
                                </div>
                            )}
                            {verifyState === 'failed' && (
                                <div className="flex items-start gap-2 text-[11px] font-bold text-accent-danger mt-1">
                                    <ShieldX className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    {verifyError}
                                </div>
                            )}

                            {verifyState === 'idle' && (
                                <p className="text-[10px] text-foreground/30 font-medium flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3 text-accent-success/50" />
                                    Auto-verified instantly on Base — no waiting.
                                </p>
                            )}
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-3 bg-accent-warning/5 border border-accent-warning/20 p-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-accent-warning shrink-0 mt-0.5" />
                            <p className="text-[10px] text-foreground/50 leading-relaxed">
                                Only send USDC on <strong className="text-foreground/70">Base Mainnet</strong>. Payments on other chains will not be credited.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleClose}
                                disabled={verifyState === 'verified'}
                                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors disabled:opacity-30"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!isValidHash || submitting || !!loading || verifyState === 'verified' || verifyState === 'verifying'}
                                className="flex-1 py-3 bg-accent-success text-background font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {verifyState === 'verifying' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {verifyState === 'verified' ? 'Activating...' :
                                    verifyState === 'verifying' ? 'Verifying...' :
                                        'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
