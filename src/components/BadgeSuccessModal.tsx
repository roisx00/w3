'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const KOL_BADGE_PATH = "M 50 4 C 61.5,4 52.6,13 61.1,15.8 C 69.7,18.5 67.8,6 77.1,12.8 C 86.4,19.5 73.8,21.6 79.1,28.8 C 84.4,36.1 90.2,24.8 93.7,35.8 C 97.3,46.7 86,41 86,50 C 86,59 97.3,53.3 93.7,64.2 C 90.2,75.2 84.4,63.9 79.1,71.2 C 73.8,78.5 86.4,80.5 77.1,87.2 C 67.8,94 70,81.5 61.1,84.2 C 52.6,87 61.5,96 50,96 C 38.5,96 47.4,87 38.9,84.2 C 30.3,81.5 32.2,94 22.9,87.2 C 13.7,80.5 26.2,78.5 20.9,71.2 C 15.6,63.9 9.8,75.2 6.3,64.2 C 2.7,53.3 14,59 14,50 C 14,41 2.7,46.7 6.3,35.8 C 9.8,24.8 15.6,36.1 20.9,28.8 C 26.2,21.6 13.7,19.5 22.9,12.8 C 32.2,6 30.3,18.5 38.9,15.8 C 47.4,13 38.5,4 50,4 Z";

// 8-bump gold seal for resume
const RESUME_BADGE_PATH = "M 50 5 C 56,5 60,12 66,11 C 72,10 74,3 80,5 C 86,7 85,15 90,19 C 95,23 102,22 103,28 C 104,34 98,38 98,44 C 98,50 104,54 103,60 C 102,66 95,66 90,70 C 85,74 86,82 80,84 C 74,86 72,79 66,78 C 60,77 56,84 50,84 C 44,84 40,77 34,78 C 28,79 26,86 20,84 C 14,82 15,74 10,70 C 5,66 -2,66 -3,60 C -4,54 2,50 2,44 C 2,38 -4,34 -3,28 C -2,22 5,23 10,19 C 15,15 14,7 20,5 C 26,3 28,10 34,11 C 40,12 44,5 50,5 Z";

interface Props {
    isOpen: boolean;
    type: 'kol' | 'resume';
    onClose: () => void;
}

// Confetti particle
function Particle({ color, style }: { color: string; style: React.CSSProperties }) {
    return (
        <div
            className="absolute w-2 h-2 rounded-sm opacity-0"
            style={{
                background: color,
                ...style,
                animation: 'confettiFall 1.4s ease-out forwards',
            }}
        />
    );
}

const CONFETTI_COLORS_KOL = ['#ff2222', '#ff6666', '#ffaa00', '#ffffff', '#cc0000'];
const CONFETTI_COLORS_RESUME = ['#f59e0b', '#fbbf24', '#fde68a', '#ffffff', '#d97706'];

export default function BadgeSuccessModal({ isOpen, type, onClose }: Props) {
    const [visible, setVisible] = useState(false);
    const [particles, setParticles] = useState<{ id: number; color: string; style: React.CSSProperties }[]>([]);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            const colors = type === 'kol' ? CONFETTI_COLORS_KOL : CONFETTI_COLORS_RESUME;
            const p = Array.from({ length: 28 }, (_, i) => ({
                id: i,
                color: colors[i % colors.length],
                style: {
                    left: `${10 + Math.random() * 80}%`,
                    top: `-10px`,
                    '--tx': `${(Math.random() - 0.5) * 60}px`,
                    '--ty': `${80 + Math.random() * 120}px`,
                    '--rot': `${Math.random() * 720}deg`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    width: `${6 + Math.random() * 8}px`,
                    height: `${6 + Math.random() * 8}px`,
                } as React.CSSProperties,
            }));
            setParticles(p);
        } else {
            const t = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(t);
        }
    }, [isOpen, type]);

    if (!visible) return null;

    const isKol = type === 'kol';

    return (
        <>
            <style>{`
                @keyframes confettiFall {
                    0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
                    100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.5); }
                }
                @keyframes badgePop {
                    0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
                    60%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
                    80%  { transform: scale(0.95) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes glowPulseKol {
                    0%, 100% { filter: drop-shadow(0 0 12px rgba(220,38,38,0.8)); }
                    50%       { filter: drop-shadow(0 0 28px rgba(220,38,38,1)) drop-shadow(0 0 50px rgba(220,38,38,0.5)); }
                }
                @keyframes glowPulseResume {
                    0%, 100% { filter: drop-shadow(0 0 12px rgba(245,158,11,0.8)); }
                    50%       { filter: drop-shadow(0 0 28px rgba(245,158,11,1)) drop-shadow(0 0 50px rgba(245,158,11,0.5)); }
                }
                @keyframes slideUp {
                    from { transform: translateY(24px); opacity: 0; }
                    to   { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>

            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ animation: 'fadeIn 0.2s ease forwards' }}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Card */}
                <div
                    className={`relative w-full max-w-sm overflow-hidden rounded-3xl border shadow-2xl ${
                        isKol
                            ? 'bg-[#0a0a0f] border-red-500/30 shadow-red-500/20'
                            : 'bg-[#0a0a0f] border-amber-500/30 shadow-amber-500/20'
                    }`}
                    style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                >
                    {/* Top glow strip */}
                    <div className={`absolute top-0 left-0 right-0 h-px ${isKol ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent'}`} />

                    {/* Confetti particles */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {particles.map(p => <Particle key={p.id} color={p.color} style={p.style} />)}
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-foreground/30 hover:text-foreground/70 hover:bg-white/5 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center">

                        {/* Badge SVG — large, animated */}
                        <div
                            className="mb-6"
                            style={{
                                animation: 'badgePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
                            }}
                        >
                            <div style={{ animation: `${isKol ? 'glowPulseKol' : 'glowPulseResume'} 2s ease-in-out 0.7s infinite` }}>
                                <svg width="96" height="96" viewBox="0 0 100 100">
                                    <defs>
                                        {isKol ? (
                                            <linearGradient id="successKolGrad" x1="25%" y1="15%" x2="75%" y2="85%">
                                                <stop offset="0%" stopColor="#ff3333" />
                                                <stop offset="50%" stopColor="#cc0000" />
                                                <stop offset="100%" stopColor="#7a0010" />
                                            </linearGradient>
                                        ) : (
                                            <linearGradient id="successResumeGrad" x1="25%" y1="15%" x2="75%" y2="85%">
                                                <stop offset="0%" stopColor="#fde68a" />
                                                <stop offset="40%" stopColor="#f59e0b" />
                                                <stop offset="100%" stopColor="#92400e" />
                                            </linearGradient>
                                        )}
                                    </defs>
                                    <path
                                        d={isKol ? KOL_BADGE_PATH : RESUME_BADGE_PATH}
                                        fill={isKol ? 'url(#successKolGrad)' : 'url(#successResumeGrad)'}
                                    />
                                    {/* Shadow layer */}
                                    <path
                                        d={isKol ? KOL_BADGE_PATH : RESUME_BADGE_PATH}
                                        fill={isKol ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.2)'}
                                        transform="translate(3,5) scale(0.95)"
                                        style={{ transformOrigin: '50px 50px' }}
                                    />
                                    <path
                                        d={isKol ? KOL_BADGE_PATH : RESUME_BADGE_PATH}
                                        fill={isKol ? 'url(#successKolGrad)' : 'url(#successResumeGrad)'}
                                    />
                                    {/* Checkmark */}
                                    <path
                                        d="M 33 50 L 44 62 L 67 36"
                                        stroke="white"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                        style={{
                                            strokeDasharray: 60,
                                            strokeDashoffset: 0,
                                            animation: 'none',
                                        }}
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Text */}
                        <div style={{ animation: 'slideUp 0.4s ease 0.4s both' }}>
                            <div className={`flex items-center justify-center gap-1.5 mb-2 text-[10px] font-black uppercase tracking-[0.3em] ${isKol ? 'text-red-400' : 'text-amber-400'}`}>
                                <Sparkles className="w-3 h-3" />
                                {isKol ? 'KOL Hub' : 'Web3 Resume'}
                            </div>
                            <h2 className="font-black text-2xl uppercase tracking-tight leading-tight mb-3">
                                {isKol ? "You're Now a\nVerified KOL!" : 'Resume\nVerified!'}
                            </h2>
                            <p className="text-sm text-foreground/50 leading-relaxed max-w-xs">
                                {isKol
                                    ? 'Your KOL profile is now verified on W3Hub. Projects can see your badge and trust your reach.'
                                    : 'Your Web3 resume is now verified. You can upload your CV and track airdrops with your badge.'
                                }
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="mt-7 w-full" style={{ animation: 'slideUp 0.4s ease 0.55s both' }}>
                            <button
                                onClick={onClose}
                                className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    isKol
                                        ? 'bg-gradient-to-r from-red-600 to-red-800 shadow-lg shadow-red-500/30 hover:shadow-red-500/50'
                                        : 'bg-gradient-to-r from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                                }`}
                            >
                                {isKol ? 'View My KOL Profile' : 'Explore Dashboard'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
