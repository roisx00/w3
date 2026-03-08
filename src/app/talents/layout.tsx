import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Talent Discovery',
    description: 'Browse through the elite workforce of the Web3 ecosystem. Filter by skills, experience, and roles.',
};

export default function TalentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
