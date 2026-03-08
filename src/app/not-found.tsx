import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-6">
            <div className="text-center space-y-8 max-w-lg">
                <div className="w-20 h-20 rounded-3xl bg-accent-danger/10 border border-accent-danger/20 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-10 h-10 text-accent-danger" />
                </div>

                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-danger mb-4">404 — Not Found</p>
                    <h1 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter mb-4">
                        Lost in the <span className="text-accent-primary">Chain</span>
                    </h1>
                    <p className="text-foreground/40 font-medium text-lg">
                        This page doesn't exist or has been moved to another block.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-8 py-4 bg-accent-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-tighter shadow-xl"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <Link
                        href="/jobs"
                        className="px-8 py-4 glass font-black rounded-xl hover:bg-white/5 transition-all text-sm uppercase tracking-tighter text-foreground/60"
                    >
                        Browse Jobs
                    </Link>
                </div>
            </div>
        </div>
    );
}
