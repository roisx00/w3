'use client';

import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldAlert, ArrowRight, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isLoggedIn, authLoading, login, loginWithEmail, registerWithEmail } = useAppContext();
    const router = useRouter();
    const [mode, setMode] = useState<'google' | 'email'>('google');
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (authLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isLoggedIn) {
        const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError('');
            setLoading(true);
            try {
                if (isRegister) {
                    await registerWithEmail(email, password);
                } else {
                    await loginWithEmail(email, password);
                }
            } catch (err: any) {
                const msg = err.code === 'auth/user-not-found' ? 'No account with that email.'
                    : err.code === 'auth/wrong-password' ? 'Incorrect password.'
                        : err.code === 'auth/email-already-in-use' ? 'Email already registered. Sign in instead.'
                            : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
                                : err.code === 'auth/invalid-email' ? 'Invalid email address.'
                                    : err.message || 'Something went wrong.';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="max-w-md w-full glass p-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-10 h-10 text-accent-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight">Login Required</h1>
                        <p className="text-foreground/60 font-medium text-sm">
                            You need an account to access this feature.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        {/* Google */}
                        <button
                            onClick={() => login()}
                            className="w-full py-3.5 flex items-center justify-center gap-3 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                            </svg>
                            Sign in with Google
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Email/Password */}
                        {mode === 'google' ? (
                            <button
                                onClick={() => setMode('email')}
                                className="w-full py-3.5 flex items-center justify-center gap-3 glass bg-white/5 border-white/10 text-foreground/70 font-black text-xs uppercase tracking-widest rounded-xl hover:border-white/20 transition-all"
                            >
                                <Mail className="w-4 h-4" />
                                Continue with Email
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
                                {/* Sign In / Sign Up toggle */}
                                <div className="flex rounded-xl overflow-hidden border border-white/10">
                                    <button type="button" onClick={() => { setIsRegister(false); setError(''); }}
                                        className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${!isRegister ? 'bg-accent-primary text-white' : 'text-foreground/40 hover:text-foreground'}`}>
                                        Sign In
                                    </button>
                                    <button type="button" onClick={() => { setIsRegister(true); setError(''); }}
                                        className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${isRegister ? 'bg-accent-primary text-white' : 'text-foreground/40 hover:text-foreground'}`}>
                                        Sign Up
                                    </button>
                                </div>

                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full glass bg-white/5 border-white/10 px-4 py-3 rounded-xl focus:border-accent-primary/50 outline-none text-sm font-medium transition-all"
                                />
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full glass bg-white/5 border-white/10 px-4 py-3 pr-12 rounded-xl focus:border-accent-primary/50 outline-none text-sm font-medium transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {error && (
                                    <p className="text-xs font-bold text-accent-danger px-1">{error}</p>
                                )}

                                <button type="submit" disabled={loading}
                                    className="w-full py-3.5 bg-accent-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {isRegister ? 'Create Account' : 'Sign In'}
                                </button>

                                <button type="button" onClick={() => { setMode('google'); setError(''); }}
                                    className="w-full text-xs text-foreground/30 hover:text-foreground/60 transition-colors py-1">
                                    ← Back
                                </button>
                            </form>
                        )}

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 text-xs font-bold text-foreground/30 hover:text-foreground/60 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthGuard;
