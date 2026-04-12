'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X, User, Copy, Check, ExternalLink } from 'lucide-react';
import GoldBadge from '@/components/GoldBadge';
import KOLBadge from '@/components/KOLBadge';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

const Navbar = () => {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [copied, setCopied] = useState(false);

    const { isLoggedIn, user, hasKolBadge, login } = useAppContext();

    const walletAddress = user?.walletAddress || '';
    const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const copyAddress = () => {
        if (!walletAddress) return;
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const navLinks = [
        { name: 'KOL Hub', href: '/kols' },
        { name: 'Resumes', href: '/talents' },
        { name: 'Jobs', href: '/jobs' },
        { name: 'Airdrops', href: '/airdrops' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Dashboard', href: '/dashboard' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
                ? 'bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 sm:px-8'
                : 'px-4 py-4 sm:px-8'
        }`}>
            <div className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-3 transition-all duration-300 ${
                scrolled ? '' : 'glass'
            }`}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <img
                        src="https://pbs.twimg.com/profile_images/2030947120291930112/A8yv3-S6_400x400.jpg"
                        alt="W3Hub"
                        className="w-8 h-8 rounded-lg object-cover group-hover:scale-110 transition-transform"
                    />
                    <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
                        W3HUB<span className="text-accent-primary">.</span>
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-sm font-medium transition-colors hover:text-accent-primary ${
                                pathname === link.href ? 'text-accent-primary' : 'text-foreground/70'
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {isLoggedIn ? (
                        <>
                            {/* Wallet address pill (desktop) */}
                            {walletAddress && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[11px] font-mono font-bold text-emerald-400">{shortAddress}</span>
                                    <button onClick={copyAddress} className="ml-1 p-0.5 hover:text-emerald-300 transition-colors">
                                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-400/60" />}
                                    </button>
                                    <a
                                        href={`https://basescan.org/address/${walletAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-0.5 hover:text-emerald-300 transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3 text-emerald-400/60" />
                                    </a>
                                </div>
                            )}

                            {/* Profile */}
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-3 py-1.5 rounded-2xl border border-accent-primary/20 bg-accent-primary/5 hover:bg-accent-primary/10 hover:border-accent-primary/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-200 active:scale-95 group"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-accent-primary/40 group-hover:ring-accent-primary/70 transition-all">
                                        {user?.photoUrl ? (
                                            <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-accent-primary/20 flex items-center justify-center">
                                                <User className="w-4 h-4 text-accent-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-success rounded-full border-2 border-background" />
                                </div>
                                <div className="hidden sm:flex flex-col leading-none">
                                    <span className="flex items-center gap-1 text-xs font-black uppercase tracking-tight text-foreground truncate max-w-[100px]">
                                        {user?.displayName?.split(' ')[0] || 'Profile'}
                                        {hasKolBadge
                                            ? <KOLBadge size={13} />
                                            : user?.hasBadge
                                                ? <GoldBadge size={13} />
                                                : null}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-accent-primary/70">
                                        Dashboard
                                    </span>
                                </div>
                            </Link>
                        </>
                    ) : (
                        <button
                            onClick={login}
                            className="flex items-center gap-2 glass-pill px-3 sm:px-4 py-2 transition-all active:scale-95 group"
                        >
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                            </svg>
                            <span className="text-sm font-semibold hidden sm:inline">Sign In with X</span>
                            <span className="text-sm font-semibold sm:hidden">Sign In</span>
                            <ArrowRight className="w-4 h-4 text-accent-primary group-hover:translate-x-1 transition-transform hidden sm:block" />
                        </button>
                    )}

                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden mt-4 glass-heavy p-8 flex flex-col gap-6 animate-in slide-in-from-top-4 shadow-2xl border-white/20">
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-2">Navigation</p>
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-xl font-black uppercase tracking-tight py-2 transition-all ${
                                    pathname === link.href ? 'text-accent-primary translate-x-2' : 'text-foreground/70 hover:translate-x-1'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="h-px bg-white/5 my-2" />

                    <div className="flex flex-col gap-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-2">Account</p>
                        {isLoggedIn ? (
                            <>
                                {walletAddress && (
                                    <div className="flex items-center justify-between p-3 glass rounded-xl border border-emerald-500/20">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                            <span className="text-xs font-mono text-emerald-400">{shortAddress}</span>
                                        </div>
                                        <button onClick={copyAddress} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-foreground/40" />}
                                        </button>
                                    </div>
                                )}
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 glass rounded-2xl border-accent-primary/20"
                                >
                                    <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center overflow-hidden border-2 border-accent-primary/30">
                                        {user?.photoUrl ? (
                                            <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-accent-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-tight">{user?.displayName || 'My Profile'}</p>
                                        <p className="text-[10px] text-foreground/40 font-bold">View Dashboard</p>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <button
                                onClick={() => { login(); setIsMenuOpen(false); }}
                                className="flex items-center justify-center gap-3 glass-pill py-5 bg-accent-primary text-white border-none"
                            >
                                <User className="w-5 h-5" />
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                                </svg>
                                <span className="font-black uppercase tracking-widest text-sm">Sign In with X</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
