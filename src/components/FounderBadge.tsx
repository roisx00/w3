'use client';

import { ShieldCheck } from 'lucide-react';

interface FounderBadgeProps {
    size?: number;
    className?: string;
}

export default function FounderBadge({ size = 20, className = '' }: FounderBadgeProps) {
    return (
        <div className={`inline-flex items-center justify-center text-accent-secondary drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] ${className}`} title="Verified Founder / Project">
            <ShieldCheck size={size} strokeWidth={2.5} />
        </div>
    );
}
