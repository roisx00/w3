'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

const Navbar = () => {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isLoggedIn, login, logout, user } = useAppContext();

    const navLinks = [
        { name: 'Talent Hub', href: '/talents' },
        { name: 'Jobs', href: '/jobs' },
        { name: 'Airdrops', href: '/airdrops' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Dashboard', href: '/dashboard' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-8">
            <div className="max-w-7xl mx-auto glass flex items-center justify-between px-6 py-3">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
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
                            className={`text-sm font-medium transition-colors hover:text-accent-primary ${pathname === link.href ? 'text-accent-primary' : 'text-foreground/70'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 glass-pill transition-all active:scale-95 group border-accent-primary/20 text-foreground/60"
                            >
                                <div className="w-5 h-5 rounded-full bg-accent-primary/20 flex items-center justify-center overflow-hidden border border-accent-primary/30">
                                    {user?.photoUrl ? (
                                        <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-3 h-3 text-accent-primary" />
                                    )}
                                </div>
                                <span className="text-sm font-semibold truncate max-w-[120px]">
                                    {user?.displayName || 'My Profile'}
                                </span>
                            </Link>
                            <button
                                onClick={() => logout()}
                                className="text-[10px] font-bold uppercase tracking-widest text-foreground/20 hover:text-accent-danger transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="hidden sm:flex items-center gap-2 glass-pill px-4 py-2 transition-all active:scale-95 group hover:shadow-[0_0_15px_rgba(0,242,255,0.2)]"
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
                                className={`text-xl font-black uppercase tracking-tight py-2 transition-all ${pathname === link.href ? 'text-accent-primary translate-x-2' : 'text-foreground/70 hover:translate-x-1'
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
                            <div className="space-y-4">
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
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full py-4 text-xs font-black uppercase tracking-widest text-accent-danger/60 hover:text-accent-danger transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    login();
                                    setIsMenuOpen(false);
                                }}
                                className="flex items-center justify-center gap-3 glass-pill py-5 bg-accent-primary text-white border-none shadow-[0_10px_20px_rgba(0,242,255,0.2)]"
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
