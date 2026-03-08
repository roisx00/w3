'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

const Navbar = () => {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isLoggedIn, login, user } = useAppContext();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = [
        { name: 'Talent Hub', href: '/talents' },
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
                    <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xs">W3</span>
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
                        HUB<span className="text-accent-primary">.</span>
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
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
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
                                <span className="text-xs font-black uppercase tracking-tight text-foreground truncate max-w-[100px]">
                                    {user?.displayName?.split(' ')[0] || 'Profile'}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-accent-primary/70">
                                    Dashboard
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <button
                            onClick={login}
                            className="hidden sm:flex items-center gap-2 glass-pill px-4 py-2 transition-all active:scale-95 group"
                        >
                            <span className="text-sm font-semibold">Sign In</span>
                            <ArrowRight className="w-4 h-4 text-accent-primary group-hover:translate-x-1 transition-transform" />
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
                        ) : (
                            <button
                                onClick={() => { login(); setIsMenuOpen(false); }}
                                className="flex items-center justify-center gap-3 glass-pill py-5 bg-accent-primary text-white border-none"
                            >
                                <User className="w-5 h-5" />
                                <span className="font-black uppercase tracking-widest text-sm">Sign In with Google</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
