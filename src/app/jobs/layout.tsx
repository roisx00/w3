import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Job Board',
    description: 'Discover verified jobs at top Web3 protocols. Early-stage startups to industry giants.',
};

export default function JobsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
