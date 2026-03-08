import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://web3hub.vercel.app'),
  title: {
    template: '%s | Web3 Hub',
    default: 'Web3 Hub | Discover Talents, Jobs & Airdrops',
  },
  description: "The elite decentralized workforce platform. Connect with top Web3 projects, showcase your technical expertise, and discover verified early airdrop opportunities.",
  keywords: ["Web3", "Blockchain", "Crypto Jobs", "Airdrops", "Smart Contracts", "DeFi", "Talent Hub"],
  openGraph: {
    title: 'Web3 Hub | Accelerating the Decentralized Future',
    description: 'Connect with top Web3 projects and discover early airdrop opportunities.',
    siteName: 'Web3 Hub',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Hub | Join the Decentralized Workforce',
    description: 'Bridge the gap between visionaries and builders in the Web3 space.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AppProvider>
          <Navbar />
          <main className="pt-24 min-h-screen">
            {children}
          </main>
          <footer className="border-t border-black/5 mt-20 py-10 px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-accent-primary flex items-center justify-center">
                  <span className="text-white font-bold text-[9px]">W3</span>
                </div>
                <span className="font-display font-bold text-sm tracking-tight">
                  HUB<span className="text-accent-primary">.</span>
                </span>
              </div>
              <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                © {new Date().getFullYear()} Web3 Hub. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                <a href="/talents" className="hover:text-foreground/60 transition-colors">Talents</a>
                <a href="/jobs" className="hover:text-foreground/60 transition-colors">Jobs</a>
                <a href="/airdrops" className="hover:text-foreground/60 transition-colors">Airdrops</a>
              </div>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
