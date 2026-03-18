import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'KOL Hub — Web3 Influencer Network',
    description: 'Discover top Web3 Key Opinion Leaders. Verified reach, real campaigns, on-chain identity. Find the perfect KOL for your project.',
};

export default function KOLsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
