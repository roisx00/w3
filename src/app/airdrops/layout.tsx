import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Airdrop Hub',
    description: 'Scan for early alpha signals. Guides and tracking for the most promising Web3 airdrops.',
};

export default function AirdropsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
