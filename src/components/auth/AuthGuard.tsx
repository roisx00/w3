'use client';

import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isLoggedIn, authLoading, login } = useAppContext();
    const router = useRouter();

    if (authLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="max-w-sm w-full glass p-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-10 h-10 text-accent-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight">Login Required</h1>
                        <p className="text-foreground/60 font-medium text-sm">
                            Sign in with X to access this feature.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        {/* X / Twitter login */}
                        <button
                            onClick={() => login()}
                            className="w-full py-3.5 flex items-center justify-center gap-3 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl border border-white/20 hover:bg-white/10 transition-all"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                            </svg>
                            Sign in with X
                        </button>

                        <p className="text-[10px] text-foreground/30 font-medium">
                            A wallet is automatically created for you on sign-in.
                        </p>

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
