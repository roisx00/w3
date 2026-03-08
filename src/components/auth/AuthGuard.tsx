'use client';

import { useAppContext } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isLoggedIn, authLoading, login } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();

    if (authLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="max-w-md w-full glass p-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-10 h-10 text-accent-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight">Login Required</h1>
                        <p className="text-foreground/60 font-medium">
                            You're free to browse, but you need an account to access this feature.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            onClick={() => login()}
                            className="w-full glass-pill py-4 flex items-center justify-center gap-3 group bg-accent-primary text-white border-none hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all"
                        >
                            <span className="font-bold">Sign In with Google</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-4 text-sm font-bold text-foreground/40 hover:text-foreground/80 transition-colors"
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
