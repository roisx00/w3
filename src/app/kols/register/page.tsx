'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { KOLProfile, KOLNiche, ContentType, KOLCampaign } from '@/lib/types';
import {
    Megaphone, ChevronRight, ChevronLeft, Check, Plus, X as XIcon,
    Loader2, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const NICHES: KOLNiche[] = ['DeFi', 'NFTs', 'Gaming', 'Layer 2', 'AI x Crypto', 'Memes', 'Infrastructure', 'DAOs', 'Trading', 'Education'];
const CONTENT_TYPES: ContentType[] = ['Threads', 'Reviews', 'Tutorials', 'AMAs', 'Alpha Calls', 'Spaces', 'Shorts', 'YouTube Videos', 'Newsletters'];
const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Turkish', 'Hindi', 'French', 'German', 'Indonesian'];
const CAMPAIGN_TYPES = ['Twitter Thread', 'YouTube Review', 'AMA', 'Alpha Call', 'Spaces Host', 'Newsletter', 'Tutorial', 'Promotional Tweet', 'TikTok Video', 'Telegram Post'];

const NICHE_COLORS: Record<string, string> = {
    'DeFi': 'border-blue-500/40 bg-blue-500/15 text-blue-400',
    'NFTs': 'border-pink-500/40 bg-pink-500/15 text-pink-400',
    'Gaming': 'border-green-500/40 bg-green-500/15 text-green-400',
    'Layer 2': 'border-purple-500/40 bg-purple-500/15 text-purple-400',
    'AI x Crypto': 'border-cyan-500/40 bg-cyan-500/15 text-cyan-400',
    'Memes': 'border-yellow-500/40 bg-yellow-500/15 text-yellow-400',
    'Infrastructure': 'border-orange-500/40 bg-orange-500/15 text-orange-400',
    'DAOs': 'border-indigo-500/40 bg-indigo-500/15 text-indigo-400',
    'Trading': 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400',
    'Education': 'border-red-500/40 bg-red-500/15 text-red-400',
};

const STEPS = ['Identity', 'Platforms', 'Content', 'Collabs', 'Rates'];

function formatNum(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
}

function StepBar({ step, total }: { step: number; total: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-[10px] font-black transition-all ${i < step ? 'bg-accent-primary border-accent-primary text-white' : i === step ? 'border-accent-primary text-accent-primary bg-accent-primary/10' : 'border-white/10 text-foreground/20'}`}>
                        {i < step ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    {i < total - 1 && <div className={`flex-1 h-px w-8 ${i < step ? 'bg-accent-primary' : 'bg-white/10'}`} />}
                </div>
            ))}
            <span className="ml-2 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{STEPS[step]}</span>
        </div>
    );
}

export default function KOLRegisterPage() {
    const { user, isLoggedIn } = useAppContext();
    const { getAccessToken } = usePrivy();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [tagline, setTagline] = useState('');
    const [bio, setBio] = useState('');
    const [niches, setNiches] = useState<KOLNiche[]>([]);
    const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
    const [languages, setLanguages] = useState<string[]>(['English']);
    const [openToCollabs, setOpenToCollabs] = useState(true);
    const [minBudget, setMinBudget] = useState('');

    // Platform fields
    const [twitterHandle, setTwitterHandle] = useState('');
    const [twitterFollowers, setTwitterFollowers] = useState('');
    const [twitterEngagement, setTwitterEngagement] = useState('');
    const [youtubeHandle, setYoutubeHandle] = useState('');
    const [youtubeSubscribers, setYoutubeSubscribers] = useState('');
    const [telegramHandle, setTelegramHandle] = useState('');
    const [telegramMembers, setTelegramMembers] = useState('');
    const [tiktokHandle, setTiktokHandle] = useState('');
    const [tiktokFollowers, setTiktokFollowers] = useState('');
    const [discordHandle, setDiscordHandle] = useState('');
    const [discordMembers, setDiscordMembers] = useState('');

    // Campaigns
    const [campaigns, setCampaigns] = useState<KOLCampaign[]>([]);
    const [newCampaign, setNewCampaign] = useState({ projectName: '', type: '', result: '', year: '', proofUrl: '' });

    // Pre-fill from user
    useEffect(() => {
        if (!user) return;
        if (!displayName) setDisplayName(user.displayName || '');
        const twitterRaw = user.socials?.twitter?.replace('@', '') || user.username || '';
        if (twitterRaw && !twitterHandle) setTwitterHandle(twitterRaw);
    }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps

    // Pre-fill from existing KOL profile
    useEffect(() => {
        if (!user?.id) return;
        getDoc(doc(db, 'kols', user.id)).then(snap => {
            if (!snap.exists()) return;
            const k = snap.data() as KOLProfile;
            setDisplayName(k.displayName || '');
            setTagline(k.tagline || '');
            setBio(k.bio || '');
            setNiches(k.niches || []);
            setContentTypes(k.contentTypes || []);
            setLanguages(k.languages || ['English']);
            setOpenToCollabs(k.openToCollabs ?? true);
            setMinBudget(k.minBudget ? String(k.minBudget) : '');
            setCampaigns(k.campaigns || []);
            if (k.platforms?.twitter) { setTwitterHandle(k.platforms.twitter.handle || ''); setTwitterFollowers(String(k.platforms.twitter.followers || '')); setTwitterEngagement(String(k.platforms.twitter.engagementRate || '')); }
            if (k.platforms?.youtube) { setYoutubeHandle(k.platforms.youtube.handle || ''); setYoutubeSubscribers(String(k.platforms.youtube.subscribers || '')); }
            if (k.platforms?.telegram) { setTelegramHandle(k.platforms.telegram.handle || ''); setTelegramMembers(String(k.platforms.telegram.members || '')); }
            if (k.platforms?.tiktok) { setTiktokHandle(k.platforms.tiktok.handle || ''); setTiktokFollowers(String(k.platforms.tiktok.followers || '')); }
            if (k.platforms?.discord) { setDiscordHandle(k.platforms.discord.handle || ''); setDiscordMembers(String(k.platforms.discord.members || '')); }
        });
    }, [user?.id]);

    const toggleNiche = (n: KOLNiche) => setNiches(v => v.includes(n) ? v.filter(x => x !== n) : [...v, n]);
    const toggleContent = (c: ContentType) => setContentTypes(v => v.includes(c) ? v.filter(x => x !== c) : [...v, c]);
    const toggleLanguage = (l: string) => setLanguages(v => v.includes(l) ? v.filter(x => x !== l) : [...v, l]);

    const addCampaign = () => {
        if (!newCampaign.projectName || !newCampaign.type) return;
        setCampaigns(v => [...v, { ...newCampaign, id: Date.now().toString() }]);
        setNewCampaign({ projectName: '', type: '', result: '', year: '', proofUrl: '' });
    };
    const removeCampaign = (id: string) => setCampaigns(v => v.filter(c => c.id !== id));

    const buildPlatforms = () => {
        const p: KOLProfile['platforms'] = {};
        if (twitterHandle && twitterFollowers) p.twitter = { handle: twitterHandle.replace('@', ''), followers: parseInt(twitterFollowers) || 0, engagementRate: parseFloat(twitterEngagement) || undefined };
        if (youtubeHandle && youtubeSubscribers) p.youtube = { handle: youtubeHandle.replace('@', ''), subscribers: parseInt(youtubeSubscribers) || 0 };
        if (telegramHandle && telegramMembers) p.telegram = { handle: telegramHandle.replace('@', ''), members: parseInt(telegramMembers) || 0 };
        if (tiktokHandle && tiktokFollowers) p.tiktok = { handle: tiktokHandle.replace('@', ''), followers: parseInt(tiktokFollowers) || 0 };
        if (discordHandle && discordMembers) p.discord = { handle: discordHandle, members: parseInt(discordMembers) || 0 };
        return p;
    };

    const computeTotalReach = (platforms: KOLProfile['platforms']) =>
        Object.values(platforms).reduce((sum: number, p: any) => sum + (p?.followers || p?.subscribers || p?.members || 0), 0);

    const handleSave = async () => {
        if (!user?.id) return;
        if (!displayName.trim()) { setError('Display name is required.'); return; }
        if (niches.length === 0) { setError('Select at least one niche.'); return; }
        setError('');
        setSaving(true);
        try {
            const platforms = buildPlatforms();
            const totalReach = computeTotalReach(platforms);

            const data = {
                displayName: displayName.trim(),
                username: user.username || '',
                tagline: tagline.trim(),
                bio: bio.trim(),
                photoUrl: user.photoUrl || '',
                walletAddress: user.walletAddress || '',
                niches,
                contentTypes,
                languages,
                platforms,
                totalReach,
                campaigns,
                openToCollabs,
                ...(minBudget ? { minBudget: parseInt(minBudget) } : {}),
            };
            const token = await getAccessToken();
            const res = await fetch('/api/kols/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ userId: user.id, data }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to save');
            router.push(`/kols/${encodeURIComponent(user.id)}`);
        } catch (e: any) {
            setError(e.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isLoggedIn) return (
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
            <Megaphone className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <h1 className="text-xl font-black uppercase text-foreground/30 mb-4">Sign In Required</h1>
            <p className="text-foreground/30 text-sm mb-6">You need to sign in with X to create a KOL profile.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl">Go to Home</Link>
        </div>
    );

    const inputCls = "w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none text-sm font-medium transition-all";
    const labelCls = "text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5";

    return (
        <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-8">
                <Link href="/kols" className="text-foreground/40 hover:text-accent-primary text-xs font-bold uppercase tracking-widest transition-colors">← KOL Hub</Link>
                <span className="text-foreground/20">/</span>
                <span className="text-foreground/40 text-xs font-bold uppercase tracking-widest">Create Profile</span>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-5 h-5 text-accent-primary" />
                    <h1 className="font-display font-black text-2xl uppercase tracking-tight">KOL Profile</h1>
                </div>
                <p className="text-foreground/40 text-sm">Build your professional Web3 KOL profile. Showcase your reach, niches, and past campaigns.</p>
            </div>

            <StepBar step={step} total={STEPS.length} />

            <div className="glass p-8 rounded-2xl border border-white/5 space-y-6">

                {/* Step 0: Identity */}
                {step === 0 && (
                    <>
                        <div>
                            <label className={labelCls}>Display Name *</label>
                            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name or handle" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Tagline *</label>
                            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. DeFi Alpha Caller · 4 years in Web3" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Bio *</label>
                            <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell projects about yourself, your audience, your strengths..." className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <label className={labelCls}>Niches * (select all that apply)</label>
                            <div className="flex flex-wrap gap-2">
                                {NICHES.map(n => (
                                    <button key={n} type="button" onClick={() => toggleNiche(n)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${niches.includes(n) ? (NICHE_COLORS[n] || 'bg-accent-primary/20 text-accent-primary border-accent-primary/40') : 'bg-white/3 text-foreground/40 border-white/10 hover:border-white/20'}`}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Step 1: Platforms */}
                {step === 1 && (
                    <div className="space-y-6">
                        {/* Twitter */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-3.5 h-3.5 text-foreground/50" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                                </svg>
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">X / Twitter</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-3">
                                    <label className={labelCls}>Handle *</label>
                                    <input value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)} placeholder="@handle" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Followers</label>
                                    <input type="number" value={twitterFollowers} onChange={e => setTwitterFollowers(e.target.value)} placeholder="e.g. 50000" className={inputCls} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Engagement Rate % (optional)</label>
                                    <input type="number" value={twitterEngagement} onChange={e => setTwitterEngagement(e.target.value)} placeholder="e.g. 2.5" className={inputCls} />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label className={labelCls}>YouTube Handle</label><input value={youtubeHandle} onChange={e => setYoutubeHandle(e.target.value)} placeholder="@channel" className={inputCls} /></div>
                            <div><label className={labelCls}>Subscribers</label><input type="number" value={youtubeSubscribers} onChange={e => setYoutubeSubscribers(e.target.value)} placeholder="10000" className={inputCls} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Telegram Channel/Group</label><input value={telegramHandle} onChange={e => setTelegramHandle(e.target.value)} placeholder="@channel" className={inputCls} /></div>
                            <div><label className={labelCls}>Members</label><input type="number" value={telegramMembers} onChange={e => setTelegramMembers(e.target.value)} placeholder="5000" className={inputCls} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label className={labelCls}>TikTok Handle</label><input value={tiktokHandle} onChange={e => setTiktokHandle(e.target.value)} placeholder="@handle" className={inputCls} /></div>
                            <div><label className={labelCls}>Followers</label><input type="number" value={tiktokFollowers} onChange={e => setTiktokFollowers(e.target.value)} placeholder="20000" className={inputCls} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Discord Server</label><input value={discordHandle} onChange={e => setDiscordHandle(e.target.value)} placeholder="ServerName or invite" className={inputCls} /></div>
                            <div><label className={labelCls}>Members</label><input type="number" value={discordMembers} onChange={e => setDiscordMembers(e.target.value)} placeholder="2000" className={inputCls} /></div>
                        </div>
                    </div>
                )}

                {/* Step 2: Content + Languages */}
                {step === 2 && (
                    <>
                        <div>
                            <label className={labelCls}>Content Formats</label>
                            <div className="flex flex-wrap gap-2">
                                {CONTENT_TYPES.map(c => (
                                    <button key={c} type="button" onClick={() => toggleContent(c)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${contentTypes.includes(c) ? 'bg-accent-primary/15 border-accent-primary/40 text-accent-primary' : 'bg-white/3 text-foreground/40 border-white/10 hover:border-white/20'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Languages</label>
                            <div className="flex flex-wrap gap-2">
                                {LANGUAGES.map(l => (
                                    <button key={l} type="button" onClick={() => toggleLanguage(l)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${languages.includes(l) ? 'bg-accent-primary/15 border-accent-primary/40 text-accent-primary' : 'bg-white/3 text-foreground/40 border-white/10 hover:border-white/20'}`}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Step 3: Past Collaborations */}
                {step === 3 && (
                    <div className="space-y-5">
                        <p className="text-xs text-foreground/40 leading-relaxed">
                            List projects you&apos;ve collaborated with. This shows your track record to projects that discover you here.
                            <span className="text-accent-primary font-bold"> At least 1 required.</span>
                        </p>
                        {campaigns.length > 0 && (
                            <div className="space-y-3">
                                {campaigns.map(c => (
                                    <div key={c.id} className="flex items-start justify-between gap-2 p-3 bg-white/3 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-black">{c.projectName}</p>
                                            <p className="text-[10px] text-accent-primary/70 font-bold">{c.type}{c.year ? ` · ${c.year}` : ''}</p>
                                            {c.result && <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{c.result}</p>}
                                        </div>
                                        <button onClick={() => removeCampaign(c.id)} className="p-1 text-foreground/20 hover:text-accent-danger transition-colors mt-0.5">
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="p-4 bg-white/3 rounded-2xl border border-white/5 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary">Add Collaboration</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={labelCls}>Project Name</label><input value={newCampaign.projectName} onChange={e => setNewCampaign(v => ({ ...v, projectName: e.target.value }))} placeholder="e.g. Uniswap" className={inputCls} /></div>
                                <div>
                                    <label className={labelCls}>Content Type</label>
                                    <select value={newCampaign.type} onChange={e => setNewCampaign(v => ({ ...v, type: e.target.value }))} className={inputCls}>
                                        <option value="">Select type</option>
                                        {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div><label className={labelCls}>Result (optional)</label><input value={newCampaign.result} onChange={e => setNewCampaign(v => ({ ...v, result: e.target.value }))} placeholder="e.g. 500K impressions" className={inputCls} /></div>
                                <div><label className={labelCls}>Year (optional)</label><input value={newCampaign.year} onChange={e => setNewCampaign(v => ({ ...v, year: e.target.value }))} placeholder="2024" className={inputCls} /></div>
                                <div className="col-span-2"><label className={labelCls}>Tweet URL (proof — paste your X/Twitter post link)</label><input value={newCampaign.proofUrl} onChange={e => setNewCampaign(v => ({ ...v, proofUrl: e.target.value }))} placeholder="https://x.com/yourhandle/status/..." className={inputCls} /></div>
                            </div>
                            <button type="button" onClick={addCampaign} disabled={!newCampaign.projectName || !newCampaign.type}
                                className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-accent-primary/20 transition-colors disabled:opacity-40">
                                <Plus className="w-3 h-3" /> Add Collaboration
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Rates + Availability */}
                {step === 4 && (
                    <>
                        <div>
                            <label className={labelCls}>Minimum Budget (USD)</label>
                            <input type="number" value={minBudget} onChange={e => setMinBudget(e.target.value)} placeholder="e.g. 500 (leave blank = negotiable)" className={inputCls} />
                            <p className="text-[10px] text-foreground/30 mt-1.5">Projects will see this as your starting rate. Leave blank to show "Negotiable".</p>
                        </div>
                        <div>
                            <label className={labelCls}>Availability</label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setOpenToCollabs(true)}
                                    className={`flex-1 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${openToCollabs ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'glass border-white/10 text-foreground/40 hover:border-white/20'}`}>
                                    <span className={`w-2 h-2 rounded-full ${openToCollabs ? 'bg-emerald-400 animate-pulse' : 'bg-white/10'}`} />
                                    Open to Collabs
                                </button>
                                <button type="button" onClick={() => setOpenToCollabs(false)}
                                    className={`flex-1 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${!openToCollabs ? 'bg-white/10 border-white/20 text-foreground' : 'glass border-white/10 text-foreground/30 hover:border-white/20'}`}>
                                    Busy / Closed
                                </button>
                            </div>
                        </div>
                        <div className="p-4 bg-accent-primary/5 border border-accent-primary/15 rounded-2xl space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary mb-3">Profile Summary</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-white/3 rounded-xl">
                                    <p className="text-lg font-black text-accent-primary">{niches.length}</p>
                                    <p className="text-[9px] text-foreground/30 font-bold uppercase">Niches</p>
                                </div>
                                <div className="text-center p-3 bg-white/3 rounded-xl">
                                    <p className="text-lg font-black text-pink-400">{campaigns.length}</p>
                                    <p className="text-[9px] text-foreground/30 font-bold uppercase">Collabs</p>
                                </div>
                                <div className="text-center p-3 bg-white/3 rounded-xl">
                                    <p className="text-lg font-black text-emerald-400">{Object.keys(buildPlatforms()).length}</p>
                                    <p className="text-[9px] text-foreground/30 font-bold uppercase">Platforms</p>
                                </div>
                            </div>
                            {twitterFollowers && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="text-[9px] font-bold text-foreground/30 bg-white/3 px-2 py-1 rounded-lg">
                                        {formatNum(parseInt(twitterFollowers))} Twitter followers
                                    </span>
                                    {twitterEngagement && (
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/8 px-2 py-1 rounded-lg">
                                            {twitterEngagement}% engagement rate
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {error && <p className="text-xs font-bold text-accent-danger">{error}</p>}

                <div className="flex justify-between pt-2">
                    {step > 0 ? (
                        <button type="button" onClick={() => setStep(s => s - 1)}
                            className="flex items-center gap-2 px-5 py-2.5 glass border border-white/10 text-foreground/50 font-black text-xs uppercase tracking-widest rounded-xl hover:border-white/20 transition-all">
                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                        </button>
                    ) : <div />}

                    {step < STEPS.length - 1 ? (
                        <button type="button" onClick={() => {
                            if (step === 0) {
                                if (!displayName.trim()) { setError('Display name is required.'); return; }
                                if (!tagline.trim()) { setError('Tagline is required.'); return; }
                                if (!bio.trim()) { setError('Bio is required.'); return; }
                                if (niches.length === 0) { setError('Select at least one niche.'); return; }
                            }
                            if (step === 1) {
                                if (!twitterHandle.trim()) { setError('X / Twitter handle is required.'); return; }
                            }
                            if (step === 3) {
                                if (campaigns.length === 0) { setError('Add at least one past collaboration.'); return; }
                            }
                            setError(''); setStep(s => s + 1);
                        }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all">
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button type="button" onClick={handleSave} disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all disabled:opacity-50">
                            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {saving ? 'Saving...' : <><Sparkles className="w-3.5 h-3.5" /> Publish Profile</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
