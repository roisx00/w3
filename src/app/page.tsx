import { Briefcase, Sparkles, Users, ArrowUpRight, MessageCircle, Wallet, FileText } from 'lucide-react';
import Link from 'next/link';
import StatsBar from '@/components/StatsBar';

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
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-12 py-5 bg-accent-primary text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-tighter shadow-xl hover:bg-accent-secondary"
            >
              Build Your Resume
            </Link>
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

      {/* Stats / Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link href="/talents" className="glass p-8 hover:border-accent-primary/30 transition-colors group text-left">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-6 border border-accent-primary/20 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-accent-primary" />
            </div>
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              Talent Discovery
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-foreground/60 text-sm leading-relaxed">
              Browse a verified database of Web3 professionals. Filter by role, experience, and ecosystem expertise.
            </p>
          </Link>

          <Link href="/jobs" className="glass p-8 hover:border-accent-secondary/30 transition-colors group text-left">
            <div className="w-12 h-12 rounded-xl bg-accent-secondary/10 flex items-center justify-center mb-6 border border-accent-secondary/20 group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6 text-accent-secondary" />
            </div>
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              Direct Hiring
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-foreground/60 text-sm leading-relaxed">
              Post listings for developers, mods, and designers. Manage applications directly through our on-chain portal.
            </p>
          </Link>

          <Link href="/airdrops" className="glass p-8 hover:border-accent-success/30 transition-colors group text-left">
            <div className="w-12 h-12 rounded-xl bg-accent-success/10 flex items-center justify-center mb-6 border border-accent-success/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-accent-success" />
            </div>
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              Alpha Discovery
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-foreground/60 text-sm leading-relaxed">
              Stay ahead of the trend with a curated dashboard of testnet campaigns and confirmed token reward programs.
            </p>
          </Link>
        </div>
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
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-3 px-10 py-4 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary hover:scale-105 transition-all text-sm uppercase tracking-widest shadow-xl"
          >
            Join the Hub
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
