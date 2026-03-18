import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0a0a0f',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '40px',
                }}
            >
                {/* Outer glow ring */}
                <div
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: '28px',
                        background: '#00f2ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 40px rgba(0,242,255,0.5)',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#000', fontWeight: 900, fontSize: 46, fontFamily: 'sans-serif', letterSpacing: '-2px', lineHeight: 1 }}>
                            W3
                        </span>
                        <span style={{ color: 'rgba(0,0,0,0.6)', fontWeight: 700, fontSize: 14, fontFamily: 'sans-serif', letterSpacing: '3px', marginTop: 2 }}>
                            HUB
                        </span>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
