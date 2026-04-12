'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, Loader2, ShieldCheck, ShieldX, Sparkles, PartyPopper, AlertCircle } from 'lucide-react';
import { PAYMENT_WALLET, BASE_CHAIN_ID, BASE_USDC_CONTRACT } from '@/lib/payments';
import { ethers } from 'ethers';
import GoldBadge from './GoldBadge';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (txHash: string) => Promise<void> | void;
    amount: number;
    description: string;
    loading?: boolean;
}

type PayState = 'idle' | 'connecting' | 'switching' | 'sending' | 'verifying' | 'confirmed' | 'celebrating' | 'failed';
type Currency = 'USDC' | 'ETH';

const USDC_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

declare global {
    interface Window {
        ethereum?: any;
    }
}

export default function PaymentModal({ isOpen, onClose, onConfirm, amount, description, loading }: PaymentModalProps) {
    const [payState, setPayState] = useState<PayState>('idle');
    const [error, setError] = useState('');
    const [currency, setCurrency] = useState<Currency>('USDC');
    const [ethPrice, setEthPrice] = useState<number>(0);
    const [connectedAddress, setConnectedAddress] = useState<string>('');

    const ethAmount = ethPrice > 0 ? (amount / ethPrice) : 0;
    const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;

    useEffect(() => {
        if (!isOpen) return;
        // Real-time ETH price
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
            .then(r => r.json())
            .then(d => { if (d?.price) setEthPrice(parseFloat(d.price)); })
            .catch(() => {
                fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot')
                    .then(r => r.json())
                    .then(d => { if (d?.data?.amount) setEthPrice(parseFloat(d.data.amount)); })
                    .catch(() => {});
            });
        // Check already-connected MetaMask account
        if (hasMetaMask) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => { if (accounts[0]) setConnectedAddress(accounts[0]); })
                .catch(() => {});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (['sending', 'verifying', 'confirmed'].includes(payState)) return;
        setPayState('idle');
        setError('');
        onClose();
    };

    const handlePay = async () => {
        if (!hasMetaMask) {
            setError('MetaMask not found. Please install MetaMask or add your wallet address in your profile settings.');
            setPayState('failed');
            return;
        }

        setError('');
        setPayState('connecting');

        try {
            // Request account access
            const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts[0]) throw new Error('No account connected');
            setConnectedAddress(accounts[0]);

            // Switch to Base Mainnet
            setPayState('switching');
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
                });
            } catch (switchErr: any) {
                // Chain not added — add it
                if (switchErr.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
                            chainName: 'Base',
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            rpcUrls: ['https://mainnet.base.org'],
                            blockExplorerUrls: ['https://basescan.org'],
                        }],
                    });
                } else {
                    throw switchErr;
                }
            }

            setPayState('sending');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            let tx: any;
            if (currency === 'ETH') {
                tx = await signer.sendTransaction({
                    to: PAYMENT_WALLET,
                    value: ethers.parseEther(ethAmount.toFixed(18)),
                });
            } else {
                const usdc = new ethers.Contract(BASE_USDC_CONTRACT, USDC_ABI, signer);
                const amountUnits = ethers.parseUnits(amount.toString(), 6);
                tx = await usdc.transfer(PAYMENT_WALLET, amountUnits);
            }

            setPayState('verifying');
            const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash: tx.hash, expectedAmount: currency === 'ETH' ? ethAmount : amount, currency }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.valid) {
                setPayState('failed');
                setError(verifyData.error || 'On-chain verification failed. Contact support with your tx hash.');
                return;
            }

            setPayState('confirmed');
            await onConfirm(tx.hash);
            setPayState('celebrating');

        } catch (e: any) {
            setPayState('failed');
            const msg = e?.message || '';
            if (msg.includes('insufficient')) setError(`Insufficient ${currency} balance on Base Mainnet.`);
            else if (msg.includes('rejected') || msg.includes('denied') || e?.code === 4001) setError('Transaction rejected.');
            else setError(msg.slice(0, 120) || 'Transaction failed. Please try again.');
        }
    };

    const payLabel = currency === 'USDC' ? `Pay $${amount} USDC` : `Pay ${ethAmount > 0 ? ethAmount.toFixed(5) : '...'} ETH`;
    const stateLabel: Record<PayState, string> = {
        idle: payLabel,
        connecting: 'Connecting wallet...',
        switching: 'Switching to Base...',
        sending: 'Confirm in MetaMask...',
        verifying: 'Confirming on-chain...',
        confirmed: 'Activating...',
        celebrating: 'Done!',
        failed: `Retry — ${payLabel}`,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative glass max-w-md w-full p-8 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {payState === 'celebrating' ? (
                    <div className="flex flex-col items-center text-center space-y-8 py-4">
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
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-primary mb-2">Payment Confirmed</p>
                                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                                    Successfully <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">Activated</span>
                                </h1>
                            </div>
                            <p className="text-sm font-bold text-foreground/40 max-w-[280px] mx-auto">
                                YOU ARE SUCCESSFULLY VERIFIED ON W3HUB
                            </p>
                        </div>
                        <div className="w-full pt-4 animate-in fade-in duration-700 delay-500">
                            <button
                                onClick={() => { setPayState('idle'); onClose(); }}
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
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-1">Pay via MetaMask</p>
                                <h2 className="text-xl font-black uppercase">{description}</h2>
                            </div>
                            <button onClick={handleClose} className="p-2 text-foreground/20 hover:text-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Currency Toggle */}
                        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                            {(['USDC', 'ETH'] as Currency[]).map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setCurrency(c); setError(''); setPayState('idle'); }}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                                        currency === c
                                            ? 'bg-accent-primary text-white shadow-lg'
                                            : 'text-foreground/40 hover:text-foreground/70'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* Amount */}
                        <div className="text-center py-6 bg-accent-success/5 border border-accent-success/20 rounded-2xl">
                            {currency === 'USDC' ? (
                                <>
                                    <p className="text-5xl font-black text-accent-success">${amount}</p>
                                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">USDC on Base Mainnet</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-5xl font-black text-accent-success">
                                        {ethAmount > 0 ? ethAmount.toFixed(6) : '...'}
                                    </p>
                                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">
                                        ETH on Base · ≈ ${amount} USD
                                        {ethPrice > 0 && <span className="ml-1">(1 ETH = ${ethPrice.toLocaleString()})</span>}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Wallet info */}
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <Wallet className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">
                                    {connectedAddress ? 'Paying from' : 'Wallet'}
                                </p>
                                <p className="text-xs font-mono text-foreground/70">
                                    {connectedAddress
                                        ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}`
                                        : hasMetaMask ? 'MetaMask (click to connect)' : 'MetaMask not detected'}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${hasMetaMask ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                                <span className={`text-[10px] font-bold ${hasMetaMask ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {hasMetaMask ? 'Base' : 'No Wallet'}
                                </span>
                            </div>
                        </div>

                        {/* Status */}
                        {payState !== 'idle' && payState !== 'failed' && (
                            <div className="flex items-center gap-2 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-xl">
                                <Loader2 className="w-4 h-4 text-accent-primary animate-spin flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-accent-primary">{stateLabel[payState]}</p>
                                    {payState === 'sending' && (
                                        <p className="text-[10px] text-foreground/30 mt-0.5">Approve the transaction in your MetaMask popup</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {payState === 'confirmed' && (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-accent-success">
                                <ShieldCheck className="w-4 h-4" />
                                On-chain confirmed — activating your perk...
                            </div>
                        )}

                        {/* Error */}
                        {payState === 'failed' && error && (
                            <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                                <ShieldX className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-400 font-bold">{error}</p>
                            </div>
                        )}

                        {/* No MetaMask warning */}
                        {!hasMetaMask && (
                            <div className="flex items-start gap-3 bg-accent-warning/5 border border-accent-warning/20 p-3 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-accent-warning shrink-0 mt-0.5" />
                                <p className="text-[10px] text-foreground/50 leading-relaxed">
                                    MetaMask is not installed.{' '}
                                    <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-accent-primary underline">
                                        Install MetaMask
                                    </a>{' '}
                                    to pay directly from your wallet.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleClose}
                                disabled={['sending', 'verifying', 'confirmed'].includes(payState)}
                                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors disabled:opacity-30"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePay}
                                disabled={!!loading || ['connecting', 'switching', 'sending', 'verifying', 'confirmed', 'celebrating'].includes(payState)}
                                className="flex-1 py-3 bg-accent-success text-background font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {['connecting', 'switching', 'sending', 'verifying', 'confirmed'].includes(payState) && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                {stateLabel[payState]}
                            </button>
                        </div>

                        <p className="text-center text-[10px] text-foreground/20 font-bold uppercase tracking-widest">
                            Sent via MetaMask · Base Mainnet · {currency}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
