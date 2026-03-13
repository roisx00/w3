import { Briefcase, Sparkles, BadgeCheck, Rocket, TrendingUp, Check, Wallet } from 'lucide-react';
import { PRICES, BASE_CHAIN_NAME, PAYMENT_WALLET } from '@/lib/payments';
import Link from 'next/link';

export const metadata = {
    title: 'Pricing — Web3 Hub',
    description: 'Transparent pricing for projects and talent on Web3 Hub. Pay in USDC on Base.',
};

const plans = [
    {
        icon: BadgeCheck,
        iconCls: 'bg-accent-primary/10 border-accent-primary/20',
        iconTextCls: 'text-accent-primary',
        priceCls: 'text-accent-primary',
        checkCls: 'text-accent-primary',
        btnCls: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20',
        title: 'Access Badge',
        subtitle: 'For Talent',
        price: PRICES.USER_BADGE,
        period: 'one-time',
        features: [
            'Upload your resume / CV',
            'Track airdrop task progress',
            'Soulbound badge on Base chain',
            'Full access to NFT Mint Sniper Bot',
            'Priority visibility in talent search',

        ],
        cta: 'Get Badge',
        href: '/onboarding',
    },
    {
        icon: TrendingUp,
        iconCls: 'bg-accent-secondary/10 border-accent-secondary/20',
        iconTextCls: 'text-accent-secondary',
        priceCls: 'text-accent-secondary',
        checkCls: 'text-accent-secondary',
        btnCls: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20 hover:bg-accent-secondary/20',
        title: 'CV Top Boost',
        subtitle: 'For Talent',
        price: PRICES.CV_BOOST_MONTHLY,
        period: '/month',
        features: [
            'Pinned to top of talent search',
            'Boosted badge on your profile',
            '30-day rolling subscription',
            'Cancel anytime',
        ],
        cta: 'Boost Your CV',
        href: '/dashboard',
    },
    {
        icon: Briefcase,
        iconCls: 'bg-accent-success/10 border-accent-success/20',
        iconTextCls: 'text-accent-success',
        priceCls: 'text-accent-success',
        checkCls: 'text-accent-success',
        btnCls: 'bg-accent-success/10 text-accent-success border-accent-success/20 hover:bg-accent-success/20',
        title: 'Job Listing',
        subtitle: 'For Projects',
        price: PRICES.JOB_POST,
        period: 'one-time',
        features: [
            'Permanent listing on job board',
            'Reach verified Web3 talent',
            'Logo + rich description',
            'Apply via Twitter or website',
        ],
        cta: 'Post a Job',
        href: '/jobs/post',
        highlight: true,
    },
    {
        icon: Rocket,
        iconCls: 'bg-accent-warning/10 border-accent-warning/20',
        iconTextCls: 'text-accent-warning',
        priceCls: 'text-accent-warning',
        checkCls: 'text-accent-warning',
        btnCls: 'bg-accent-warning/10 text-accent-warning border-accent-warning/20 hover:bg-accent-warning/20',
        title: 'Job Top Boost',
        subtitle: 'For Projects',
        price: PRICES.JOB_BOOST_MONTHLY,
        period: '/month',
        features: [
            'Pinned to top of job board',
            'Featured badge on listing',
            '30-day rolling subscription',
            'Maximum candidate visibility',
        ],
        cta: 'Boost a Job',
        href: '/jobs/post',
    },
    {
        icon: Sparkles,
        iconCls: 'bg-accent-secondary/10 border-accent-secondary/20',
        iconTextCls: 'text-accent-secondary',
        priceCls: 'text-accent-secondary',
        checkCls: 'text-accent-secondary',
        btnCls: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20 hover:bg-accent-secondary/20',
        title: 'Airdrop Listing',
        subtitle: 'For Projects',
        price: PRICES.AIRDROP_POST,
        period: 'one-time',
        features: [
            'Listed in airdrop alpha hub',
            'Step-by-step task guide',
            'Reach active airdrop hunters',
            'Logo + funding stats',
        ],
        cta: 'Submit Airdrop',
        href: '/airdrops/submit',
    },
];

export default function PricingPage() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <header className="text-center mb-16">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary mb-4">Transparent Pricing</p>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
                    All payments in <span className="text-accent-success">USDC</span>
                </h1>
                <p className="text-foreground/40 font-medium text-lg max-w-xl mx-auto">
                    On Base Mainnet. No hidden fees. Verified instantly on-chain.
                </p>
            </header>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                        <div
                            key={plan.title}
                            className={`glass p-8 flex flex-col gap-6 relative overflow-hidden ${plan.highlight ? 'border-accent-success/30 bg-accent-success/5' : ''}`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-4 right-4">
                                    <span className="px-2 py-1 bg-accent-success text-background text-[9px] font-black uppercase tracking-widest rounded-full">
                                        Popular
                                    </span>
                                </div>
                            )}
                            <div>
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${plan.iconCls}`}>
                                    <Icon className={`w-6 h-6 ${plan.iconTextCls}`} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">{plan.subtitle}</p>
                                <h2 className="text-xl font-black uppercase">{plan.title}</h2>
                            </div>

                            <div>
                                <span className={`text-4xl font-black ${plan.priceCls}`}>${plan.price}</span>
                                <span className="text-sm text-foreground/40 font-bold ml-1">USDC{plan.period !== 'one-time' ? plan.period : ''}</span>
                                {plan.period === 'one-time' && (
                                    <span className="ml-2 px-2 py-0.5 bg-white/5 text-[9px] font-black uppercase text-foreground/30 rounded">One-time</span>
                                )}
                            </div>

                            <ul className="space-y-3 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-3">
                                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.checkCls}`} />
                                        <span className="text-sm text-foreground/60 font-medium">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`w-full py-3 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 border ${plan.btnCls}`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* How it works */}
            <section className="glass p-10 mb-12">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-primary mb-8">How Payment Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { step: '01', title: 'Fill the form', desc: 'Complete your job, airdrop, or profile form.' },
                        { step: '02', title: 'Send USDC', desc: `Send the exact USDC amount on ${BASE_CHAIN_NAME} to our wallet.` },
                        { step: '03', title: 'Submit TX hash', desc: 'Paste your transaction hash in the payment modal.' },
                        { step: '04', title: 'Go live instantly', desc: 'We verify on-chain in seconds. Your listing activates immediately — no waiting.' },
                    ].map((s) => (
                        <div key={s.step} className="space-y-2">
                            <p className="text-4xl font-black text-foreground/10">{s.step}</p>
                            <p className="font-black uppercase tracking-tight">{s.title}</p>
                            <p className="text-sm text-foreground/40 font-medium">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Wallet address */}
            <section className="glass p-8 bg-accent-primary/5 border-accent-primary/20 text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary">Our USDC Address on Base</p>
                <div className="flex items-center justify-center gap-3">
                    <Wallet className="w-5 h-5 text-accent-primary" />
                    <code className="text-sm font-mono text-foreground/60 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        {PAYMENT_WALLET}
                    </code>
                </div>
                <p className="text-xs text-foreground/30 font-medium">
                    Only send USDC on Base Mainnet. Other chains will not be credited.
                </p>
            </section>
        </div>
    );
}
