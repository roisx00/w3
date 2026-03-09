import { Briefcase, Sparkles, Users, ArrowUpRight, MessageCircle, Wallet, FileText } from 'lucide-react';
import Link from 'next/link';
import StatsBar from '@/components/StatsBar';
import HomeCTA from '@/components/HomeCTA';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/10 rounded-full blur-[120px] animate-glow-pulse" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] -ml-64 -mb-64" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-2 border-white/5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">The Future of Web3 Recruitment</span>
          </div>

          <h1 className="font-display font-black text-6xl md:text-8xl lg:text-9xl mb-8 tracking-tighter uppercase leading-[0.85] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Build Your <br />
            <span className="text-accent-primary">Web3 Legacy</span>
          </h1>

          <p className="max-w-2xl mx-auto text-foreground/60 text-lg md:text-xl font-medium mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            The decentralized hub connecting elite crypto talent with top-tier projects. Resumes, Airdrops, and Careers—all in one ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <HomeCTA />
            <Link
              href="/jobs"
              className="w-full sm:w-auto px-12 py-5 glass border-white/5 font-black rounded-2xl hover:bg-white/5 transition-all text-sm uppercase tracking-tighter text-foreground/60"
            >
              Explore Hub
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <StatsBar />

      {/* 3 Pillars */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 space-y-6">
        <div className="text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/30 mb-3">What We Offer</p>
          <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">Three pillars. <span className="text-accent-primary">One ecosystem.</span></h2>
        </div>

        {/* Pillar 1 — Resumes */}
        <Link href="/onboarding" className="group block glass p-8 md:p-10 hover:border-accent-primary/40 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-accent-primary/10 transition-colors" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="shrink-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary/50 mb-2">01</div>
              <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-accent-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-display font-black text-3xl uppercase tracking-tight">Resumes</h3>
                <ArrowUpRight className="w-5 h-5 text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-foreground/50 text-base mb-5 max-w-xl">Build your Web3 resume once — share it everywhere. Your proof of work, on-chain history, and skills in one shareable link.</p>
              <div className="flex flex-wrap gap-2">
                {['Discord Moderation', 'Community Manager', 'Solidity Dev', 'Marketing', 'Ambassador', 'Designer', 'Researcher', 'Project Manager'].map(skill => (
                  <span key={skill} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary/70">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* Pillar 2 — Airdrops */}
        <Link href="/airdrops" className="group block glass p-8 md:p-10 hover:border-accent-success/40 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-success/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-accent-success/10 transition-colors" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="shrink-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-success/50 mb-2">02</div>
              <div className="w-16 h-16 rounded-2xl bg-accent-success/10 border border-accent-success/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-accent-success" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-display font-black text-3xl uppercase tracking-tight">Airdrops</h3>
                <ArrowUpRight className="w-5 h-5 text-accent-success opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-foreground/50 text-base mb-5 max-w-xl">Discover new airdrops early. Curated alpha — testnet campaigns, confirmed token rewards, and points programs — before everyone else finds out.</p>
              <div className="flex flex-wrap gap-2">
                {['Testnet Tasks', 'Points Programs', 'Token Rewards', 'Early Access', 'NFT Mints', 'DeFi Protocols'].map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-accent-success/10 border border-accent-success/20 text-accent-success/70">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* Pillar 3 — Careers */}
        <Link href="/jobs" className="group block glass p-8 md:p-10 hover:border-accent-secondary/40 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-secondary/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-accent-secondary/10 transition-colors" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="shrink-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-secondary/50 mb-2">03</div>
              <div className="w-16 h-16 rounded-2xl bg-accent-secondary/10 border border-accent-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8 text-accent-secondary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-display font-black text-3xl uppercase tracking-tight">Careers</h3>
                <ArrowUpRight className="w-5 h-5 text-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-foreground/50 text-base mb-5 max-w-xl">Projects post jobs. Talent gets hired directly — no middlemen, no recruiters. Apply on-chain, get paid in crypto.</p>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Freelance', 'Paid in USDC', 'Remote', 'Token Comp', 'Entry Level', 'Senior'].map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary/70">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Why W3Hub */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent-primary mb-4">The Problem</p>
          <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight mb-6 leading-tight">
            Web3 talent is <span className="text-foreground/30">scattered.</span>
          </h2>
          <p className="text-foreground/50 text-lg leading-relaxed">
            Hiring happens in Discord DMs. Resumes live in random Google Docs. Airdrop alpha gets buried in Telegram groups.
            There's no single place where talent, projects, and opportunities actually connect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Before */}
          <div className="glass p-6 border-accent-danger/20 bg-accent-danger/5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent-danger">Before W3Hub</p>
            <div className="space-y-3">
              {[
                { icon: MessageCircle, text: 'Job offers buried in Discord DMs' },
                { icon: FileText, text: 'Resumes as Google Docs nobody finds' },
                { icon: Wallet, text: 'Airdrop alpha lost in Telegram noise' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-foreground/50">
                  <div className="w-6 h-6 rounded-lg bg-accent-danger/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-accent-danger" />
                  </div>
                  <span className="line-through decoration-accent-danger/40">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto">
                <span className="text-2xl font-black text-accent-primary">W3</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary">One hub</p>
            </div>
          </div>

          {/* After */}
          <div className="glass p-6 border-accent-success/20 bg-accent-success/5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent-success">With W3Hub</p>
            <div className="space-y-3">
              {[
                { icon: Users, text: 'Verified talent profiles, searchable' },
                { icon: Briefcase, text: 'Jobs posted publicly, applied on-chain' },
                { icon: Sparkles, text: 'Curated airdrop alpha in one place' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-foreground/70">
                  <div className="w-6 h-6 rounded-lg bg-accent-success/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-accent-success" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <HomeCTA />
        </div>
      </section>
    </div>
  );
}
