import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Web3 Hub | Discover Talents, Jobs & Airdrops';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0a0a0a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Glow blobs */}
                <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(0,242,255,0.08)', filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', bottom: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(138,43,226,0.08)', filter: 'blur(80px)' }} />

                {/* Logo badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#00f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#000', fontWeight: 900, fontSize: 20 }}>W3</span>
                    </div>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 32, letterSpacing: -1 }}>
                        HUB<span style={{ color: '#00f2ff' }}>.</span>
                    </span>
                </div>

                <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 80, textTransform: 'uppercase', letterSpacing: -4, textAlign: 'center', lineHeight: 0.9, margin: 0 }}>
                    Build Your{' '}
                    <span style={{ color: '#00f2ff' }}>Web3 Legacy</span>
                </h1>

                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24, marginTop: 32, textAlign: 'center', maxWidth: 700 }}>
                    Talents · Jobs · Airdrops — All in one ecosystem
                </p>
            </div>
        ),
        { ...size }
    );
}
