'use client';

import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

export default function HomeCTA() {
    const { isLoggedIn } = useAppContext();

    return (
        <Link
            href={isLoggedIn ? '/dashboard' : '/dashboard'}
            className="inline-flex items-center gap-3 px-10 py-4 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary hover:scale-105 transition-all text-sm uppercase tracking-widest shadow-xl"
        >
            {isLoggedIn ? 'Go to Dashboard' : 'Join the Hub'}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </Link>
    );
}
