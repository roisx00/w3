'use client';

import { useState } from 'react';
import { Copy, Check, X, Wallet, AlertCircle, ExternalLink } from 'lucide-react';
import { PAYMENT_WALLET, BASE_CHAIN_NAME, BASE_EXPLORER_TX } from '@/lib/payments';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (txHash: string) => Promise<void> | void;
    amount: number;
    description: string;
    loading?: boolean;
}

export default function PaymentModal({ isOpen, onClose, onConfirm, amount, description, loading }: PaymentModalProps) {
    const [txHash, setTxHash] = useState('');
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const copyAddress = async () => {
        await navigator.clipboard.writeText(PAYMENT_WALLET);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async () => {
        if (!txHash.trim()) {
            alert('Please enter your transaction hash.');
            return;
        }
        if (!/^0x[a-fA-F0-9]{64}$/.test(txHash.trim())) {
            alert('Please enter a valid Base transaction hash (0x followed by 64 hex characters).');
            return;
        }
        setSubmitting(true);
        try {
            await onConfirm(txHash.trim());
            setTxHash('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass max-w-md w-full p-8 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-1">Payment Required</p>
                        <h2 className="text-xl font-black uppercase">{description}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-foreground/20 hover:text-foreground transition-colors">
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
                        onChange={e => setTxHash(e.target.value)}
                        placeholder="0x..."
                        className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-success/50 outline-none transition-all font-mono text-xs"
                    />
                    {/^0x[a-fA-F0-9]{64}$/.test(txHash.trim()) && (
                        <a
                            href={`${BASE_EXPLORER_TX}${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-accent-primary hover:underline"
                        >
                            <ExternalLink className="w-3 h-3" /> View on BaseScan
                        </a>
                    )}
                    <p className="text-[10px] text-foreground/20 font-medium">
                        We verify manually within 24h and activate your listing.
                    </p>
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
                        onClick={onClose}
                        className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!txHash.trim() || submitting || !!loading}
                        className="flex-1 py-3 bg-accent-success text-background font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {submitting || loading ? 'Confirming...' : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
