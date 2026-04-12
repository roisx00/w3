'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleXCallback } from '@/lib/xAuth';
import { useAppContext } from '@/context/AppContext';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { isLoggedIn } = useAppContext();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        (async () => {
            // If already logged in just redirect
            if (isLoggedIn) { router.replace('/dashboard'); return; }

            const xUser = await handleXCallback();
            if (xUser) {
                // AppContext will detect the stored token on next render and load profile
                // Give it a moment then redirect
                setTimeout(() => router.replace('/dashboard'), 500);
            } else {
                setStatus('error');
                setErrorMsg('Login failed. Please try again.');
                setTimeout(() => router.replace('/'), 3000);
            }
        })();
    }, []);

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-400 font-bold">{errorMsg}</p>
                    <p className="text-foreground/40 text-sm">Redirecting back...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-accent-primary)' }}>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-black uppercase tracking-widest text-foreground/60">Signing you in with X...</p>
                    <p className="text-[10px] text-foreground/30 mt-1">Setting up your Web3 Hub profile</p>
                </div>
                <div className="flex justify-center gap-1">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
