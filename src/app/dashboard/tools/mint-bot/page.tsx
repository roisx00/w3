'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
    Bot, Plus, Trash2, Play, Square, ExternalLink, RefreshCw,
    Wallet, ChevronRight, CheckCircle2, XCircle, Loader2,
    AlertTriangle, Eye, EyeOff, Zap, Activity, Clock, Hash
} from 'lucide-react';
import Link from 'next/link';

interface BotWallet { id: string; name: string; address: string; }
interface BotJob {
    id: string; walletAddress: string; contractAddress: string;
    mintFunction: string; mintAmount: number; mintPrice: string;
    gasMultiplier: number; status: string; txHash?: string;
    error?: string; createdAt: any;
}
interface BotLog { id: string; message: string; type: string; timestamp: any; }

const CHAINS: Record<number, { name: string; explorer: string; rpc: string }> = {
    8453:    { name: 'Base',     explorer: 'https://basescan.org/tx/',     rpc: 'https://mainnet.base.org' },
    1:       { name: 'Ethereum', explorer: 'https://etherscan.io/tx/',     rpc: 'https://eth.llamarpc.com' },
    137:     { name: 'Polygon',  explorer: 'https://polygonscan.com/tx/',  rpc: 'https://polygon.llamarpc.com' },
    42161:   { name: 'Arbitrum', explorer: 'https://arbiscan.io/tx/',      rpc: 'https://arb1.arbitrum.io/rpc' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    pending:    { label: 'Pending',    color: 'text-foreground/40',    dot: 'bg-foreground/20' },
    monitoring: { label: 'Monitoring', color: 'text-accent-primary',   dot: 'bg-accent-primary animate-pulse' },
    minting:    { label: 'Minting…',   color: 'text-accent-warning',   dot: 'bg-accent-warning animate-pulse' },
    success:    { label: 'Success',    color: 'text-accent-success',   dot: 'bg-accent-success' },
    failed:     { label: 'Failed',     color: 'text-accent-danger',    dot: 'bg-accent-danger' },
    stopped:    { label: 'Stopped',    color: 'text-foreground/30',    dot: 'bg-foreground/10' },
};

export default function MintBotPage() {
    const { user, isLoggedIn, authLoading } = useAppContext();
    const router = useRouter();

    // Wallets
    const [wallets, setWallets] = useState<BotWallet[]>([]);
    const [showAddWallet, setShowAddWallet] = useState(false);
    const [walletName, setWalletName] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [addingWallet, setAddingWallet] = useState(false);

    // Jobs
    const [jobs, setJobs] = useState<BotJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<BotJob | null>(null);
    const [logs, setLogs] = useState<BotLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // New job form
    const [showNewJob, setShowNewJob] = useState(false);
    const [startingJob, setStartingJob] = useState(false);
    const [jobForm, setJobForm] = useState({
        walletId: '',
        contractAddress: '',
        chainId: 8453,
        rpcUrl: CHAINS[8453].rpc,
        mintFunction: 'mint',
        mintAmount: 1,
        mintPrice: '0',
        gasMultiplier: 1.3,
        maxRetries: 3,
    });

    const [loadingWallets, setLoadingWallets] = useState(false);
    const [loadingJobs, setLoadingJobs] = useState(false);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push('/');
    }, [authLoading, isLoggedIn, router]);

    const fetchWallets = useCallback(async () => {
        if (!user?.id) return;
        setLoadingWallets(true);
        try {
            const res = await fetch(`/api/mint-bot/wallets?userId=${user.id}`);
            const data = await res.json();
            setWallets(data.wallets || []);
        } catch { /* silent */ } finally { setLoadingWallets(false); }
    }, [user?.id]);

    const fetchJobs = useCallback(async () => {
        if (!user?.id) return;
        setLoadingJobs(true);
        try {
            const res = await fetch(`/api/mint-bot/jobs?userId=${user.id}`);
            const data = await res.json();
            setJobs(data.jobs || []);
        } catch { /* silent */ } finally { setLoadingJobs(false); }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) { fetchWallets(); fetchJobs(); }
    }, [user?.id, fetchWallets, fetchJobs]);

    // Poll active jobs every 5s
    useEffect(() => {
        const hasActive = jobs.some(j => j.status === 'monitoring' || j.status === 'minting');
        if (!hasActive) return;
        const t = setInterval(fetchJobs, 5000);
        return () => clearInterval(t);
    }, [jobs, fetchJobs]);

    const fetchLogs = async (jobId: string) => {
        setLoadingLogs(true);
        try {
            const res = await fetch(`/api/mint-bot/logs?jobId=${jobId}`);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch { /* silent */ } finally { setLoadingLogs(false); }
    };

    const handleAddWallet = async () => {
        if (!walletName.trim() || !privateKey.trim()) return;
        setAddingWallet(true);
        try {
            const res = await fetch('/api/mint-bot/wallets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user!.id, name: walletName.trim(), privateKey: privateKey.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Failed to add wallet.'); return; }
            setWallets(prev => [{ id: data.id, name: data.name, address: data.address }, ...prev]);
            setWalletName(''); setPrivateKey(''); setShowAddWallet(false);
        } catch { alert('Network error.'); } finally { setAddingWallet(false); }
    };

    const handleDeleteWallet = async (id: string) => {
        if (!confirm('Remove this wallet? This cannot be undone.')) return;
        await fetch(`/api/mint-bot/wallets?id=${id}&userId=${user!.id}`, { method: 'DELETE' });
        setWallets(prev => prev.filter(w => w.id !== id));
    };

    const handleStartBot = async () => {
        if (!jobForm.walletId || !jobForm.contractAddress.trim()) {
            alert('Select a wallet and enter the contract address.'); return;
        }
        setStartingJob(true);
        try {
            const selectedWallet = wallets.find(w => w.id === jobForm.walletId);
            const res = await fetch('/api/mint-bot/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user!.id,
                    walletAddress: selectedWallet?.address,
                    ...jobForm,
                }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Failed to start bot.'); return; }
            setJobs(prev => [data, ...prev]);
            setShowNewJob(false);
            setJobForm(f => ({ ...f, contractAddress: '', mintPrice: '0' }));
        } catch { alert('Network error.'); } finally { setStartingJob(false); }
    };

    const handleStopJob = async (id: string) => {
        await fetch(`/api/mint-bot/jobs?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user!.id, status: 'stopped' }),
        });
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'stopped' } : j));
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-foreground/30 font-bold uppercase tracking-widest">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground/60">Tools</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground">Mint Bot</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-accent-primary" />
                        </div>
                        <h1 className="font-display font-black text-2xl uppercase tracking-tight">NFT Mint Sniper</h1>
                    </div>
                    <p className="text-sm text-foreground/40 font-medium pl-13">Monitors contracts and auto-mints the moment a sale goes live.</p>
                </div>
                <button
                    onClick={() => setShowNewJob(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary hover:scale-105 active:scale-95 transition-all shadow-[0_8px_24px_rgba(124,58,237,0.3)]"
                >
                    <Play className="w-4 h-4" /> Start Sniper
                </button>
            </div>

            {/* Warning Banner */}
            <div className="flex items-start gap-3 px-5 py-4 bg-accent-warning/5 border border-accent-warning/20 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-accent-warning shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/60 leading-relaxed">
                    <strong className="text-foreground/80">Security:</strong> Private keys are encrypted with AES-256-GCM server-side and never exposed to the browser.
                    Bot execution runs as a separate backend service — see <code className="text-accent-primary">bot/</code> directory for setup.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Wallets */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-xs uppercase tracking-widest text-foreground/40 flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5" /> Wallets
                        </h2>
                        <button
                            onClick={() => setShowAddWallet(!showAddWallet)}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent-primary hover:text-accent-secondary transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    {/* Add wallet form */}
                    {showAddWallet && (
                        <div className="glass p-5 rounded-2xl border border-accent-primary/20 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary">New Wallet</p>
                            <input
                                type="text"
                                value={walletName}
                                onChange={e => setWalletName(e.target.value)}
                                placeholder="Wallet name (e.g. Main Sniper)"
                                className="w-full glass bg-white/5 border-white/10 px-3 py-2.5 rounded-xl text-xs font-medium outline-none focus:border-accent-primary/50"
                            />
                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={privateKey}
                                    onChange={e => setPrivateKey(e.target.value)}
                                    placeholder="Private key (0x...)"
                                    className="w-full glass bg-white/5 border-white/10 px-3 py-2.5 pr-10 rounded-xl text-xs font-mono outline-none focus:border-accent-primary/50"
                                />
                                <button onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowAddWallet(false)}
                                    className="flex-1 py-2 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleAddWallet} disabled={addingWallet}
                                    className="flex-1 py-2 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {addingWallet && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Wallet list */}
                    {loadingWallets ? (
                        <div className="flex items-center gap-2 text-xs text-foreground/30 py-4">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading wallets...
                        </div>
                    ) : wallets.length === 0 ? (
                        <div className="glass p-6 rounded-2xl text-center border-dashed border border-white/10">
                            <Wallet className="w-8 h-8 text-foreground/10 mx-auto mb-2" />
                            <p className="text-xs text-foreground/30 font-medium">No wallets added yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {wallets.map(w => (
                                <div key={w.id} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-3 group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                                            <Wallet className="w-3.5 h-3.5 text-accent-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs truncate">{w.name}</p>
                                            <p className="text-[10px] font-mono text-foreground/30 truncate">
                                                {w.address.slice(0, 8)}…{w.address.slice(-6)}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteWallet(w.id)}
                                        className="p-1.5 text-foreground/20 hover:text-accent-danger transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Jobs */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-xs uppercase tracking-widest text-foreground/40 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Active Snipers
                        </h2>
                        <button onClick={fetchJobs} className="p-1.5 text-foreground/30 hover:text-foreground transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {loadingJobs ? (
                        <div className="flex items-center gap-2 text-xs text-foreground/30 py-4">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading jobs...
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="glass p-10 rounded-2xl text-center border-dashed border border-white/10">
                            <Bot className="w-10 h-10 text-foreground/10 mx-auto mb-3" />
                            <p className="font-black text-sm text-foreground/30 uppercase tracking-wide mb-1">No snipers running</p>
                            <p className="text-xs text-foreground/20">Press Start Sniper to monitor a contract.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map(job => {
                                const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
                                const chainCfg = CHAINS[job.chainId as number];
                                return (
                                    <div key={job.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-1`} />
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-xs font-bold text-foreground/80 truncate">
                                                            {job.contractAddress.slice(0, 10)}…{job.contractAddress.slice(-8)}
                                                        </p>
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                                                            {cfg.label}
                                                            {chainCfg && <span className="text-foreground/20 ml-2 font-bold normal-case">· {chainCfg.name}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {(job.status === 'monitoring' || job.status === 'minting') && (
                                                        <button onClick={() => handleStopJob(job.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent-danger/20 transition-colors">
                                                            <Square className="w-3 h-3" /> Stop
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedJob(job);
                                                            fetchLogs(job.id);
                                                        }}
                                                        className="px-3 py-1.5 bg-white/5 border border-white/10 text-foreground/40 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                                                    >
                                                        Logs
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Job meta */}
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <div className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold">
                                                    <Zap className="w-3 h-3" />
                                                    {job.mintFunction}({job.mintAmount})
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold">
                                                    Price: {job.mintPrice} ETH
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold">
                                                    Gas: ×{job.gasMultiplier}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold font-mono truncate max-w-[180px]">
                                                    <Wallet className="w-3 h-3 shrink-0" />
                                                    {job.walletAddress?.slice(0, 8)}…{job.walletAddress?.slice(-4)}
                                                </div>
                                            </div>

                                            {/* Success state */}
                                            {job.status === 'success' && job.txHash && (
                                                <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-accent-success/10 border border-accent-success/20 rounded-xl">
                                                    <CheckCircle2 className="w-4 h-4 text-accent-success shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-accent-success uppercase tracking-wide">Mint Successful!</p>
                                                        <p className="text-[10px] font-mono text-foreground/40 truncate">{job.txHash}</p>
                                                    </div>
                                                    {chainCfg && (
                                                        <a href={`${chainCfg.explorer}${job.txHash}`} target="_blank" rel="noopener noreferrer"
                                                            className="text-accent-success hover:text-accent-primary transition-colors shrink-0">
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Failed state */}
                                            {job.status === 'failed' && job.error && (
                                                <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-accent-danger/10 border border-accent-danger/20 rounded-xl">
                                                    <XCircle className="w-4 h-4 text-accent-danger shrink-0 mt-0.5" />
                                                    <p className="text-xs text-accent-danger">{job.error}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Inline logs panel */}
                                        {selectedJob?.id === job.id && (
                                            <div className="border-t border-white/5 bg-black/30 p-5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-3 flex items-center gap-2">
                                                    <Hash className="w-3 h-3" /> Activity Log
                                                </p>
                                                {loadingLogs ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-foreground/30" />
                                                ) : logs.length === 0 ? (
                                                    <p className="text-xs text-foreground/20 italic">No logs yet.</p>
                                                ) : (
                                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                                        {logs.map(log => (
                                                            <div key={log.id} className="flex items-start gap-2 text-[11px] font-mono">
                                                                <span className={`shrink-0 ${
                                                                    log.type === 'success' ? 'text-accent-success' :
                                                                    log.type === 'error' ? 'text-accent-danger' :
                                                                    log.type === 'warn' ? 'text-accent-warning' :
                                                                    'text-foreground/30'
                                                                }`}>
                                                                    {log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : log.type === 'warn' ? '!' : '›'}
                                                                </span>
                                                                <span className="text-foreground/60">{log.message}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* New Job Modal */}
            {showNewJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewJob(false)} />
                    <div className="relative glass max-w-lg w-full p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-1">Configure Sniper</p>
                            <h2 className="text-xl font-black uppercase">New Mint Bot</h2>
                        </div>

                        {/* Wallet select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Wallet</label>
                            {wallets.length === 0 ? (
                                <p className="text-xs text-accent-danger font-bold">Add a wallet first.</p>
                            ) : (
                                <select
                                    value={jobForm.walletId}
                                    onChange={e => setJobForm(f => ({ ...f, walletId: e.target.value }))}
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-accent-primary/50"
                                >
                                    <option value="">Select wallet…</option>
                                    {wallets.map(w => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} · {w.address.slice(0, 8)}…{w.address.slice(-4)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Contract address */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Contract Address</label>
                            <input
                                type="text"
                                value={jobForm.contractAddress}
                                onChange={e => setJobForm(f => ({ ...f, contractAddress: e.target.value }))}
                                placeholder="0x..."
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl text-xs font-mono outline-none focus:border-accent-primary/50"
                            />
                        </div>

                        {/* Chain + RPC */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Chain</label>
                                <select
                                    value={jobForm.chainId}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        setJobForm(f => ({ ...f, chainId: id, rpcUrl: CHAINS[id]?.rpc || '' }));
                                    }}
                                    className="w-full glass bg-white/5 border-white/10 px-3 py-3 rounded-xl text-xs font-bold outline-none focus:border-accent-primary/50"
                                >
                                    {Object.entries(CHAINS).map(([id, c]) => (
                                        <option key={id} value={id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Mint Function</label>
                                <select
                                    value={jobForm.mintFunction}
                                    onChange={e => setJobForm(f => ({ ...f, mintFunction: e.target.value }))}
                                    className="w-full glass bg-white/5 border-white/10 px-3 py-3 rounded-xl text-xs font-bold outline-none focus:border-accent-primary/50"
                                >
                                    <option value="mint">mint()</option>
                                    <option value="publicMint">publicMint()</option>
                                    <option value="whitelistMint">whitelistMint()</option>
                                </select>
                            </div>
                        </div>

                        {/* Custom RPC */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">RPC URL (Alchemy/QuickNode recommended)</label>
                            <input
                                type="text"
                                value={jobForm.rpcUrl}
                                onChange={e => setJobForm(f => ({ ...f, rpcUrl: e.target.value }))}
                                placeholder="https://..."
                                className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl text-xs font-mono outline-none focus:border-accent-primary/50"
                            />
                        </div>

                        {/* Amount + Price */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Mint Amount</label>
                                <input
                                    type="number" min="1" max="20"
                                    value={jobForm.mintAmount}
                                    onChange={e => setJobForm(f => ({ ...f, mintAmount: Number(e.target.value) }))}
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-accent-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Mint Price (ETH)</label>
                                <input
                                    type="text"
                                    value={jobForm.mintPrice}
                                    onChange={e => setJobForm(f => ({ ...f, mintPrice: e.target.value }))}
                                    placeholder="0.08"
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl text-xs font-mono outline-none focus:border-accent-primary/50"
                                />
                            </div>
                        </div>

                        {/* Gas + Retries */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Gas Multiplier</label>
                                <input
                                    type="number" step="0.1" min="1" max="5"
                                    value={jobForm.gasMultiplier}
                                    onChange={e => setJobForm(f => ({ ...f, gasMultiplier: Number(e.target.value) }))}
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-accent-primary/50"
                                />
                                <p className="text-[9px] text-foreground/20">1.3 = +30% gas priority</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Max Retries</label>
                                <input
                                    type="number" min="1" max="10"
                                    value={jobForm.maxRetries}
                                    onChange={e => setJobForm(f => ({ ...f, maxRetries: Number(e.target.value) }))}
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-accent-primary/50"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowNewJob(false)}
                                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleStartBot} disabled={startingJob || wallets.length === 0}
                                className="flex-1 py-3 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(124,58,237,0.3)]">
                                {startingJob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                {startingJob ? 'Starting…' : 'Start Sniper'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
