'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralCapture() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref && ref.trim()) {
            // Only save if not already referred
            const existing = localStorage.getItem('hub_ref');
            if (!existing) {
                localStorage.setItem('hub_ref', ref.trim());
            }
        }
    }, [searchParams]);

    return null;
}
