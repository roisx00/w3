import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#00f2ff',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '7px',
                }}
            >
                <span style={{ color: '#000', fontWeight: 900, fontSize: 13, fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
                    W3
                </span>
            </div>
        ),
        { ...size }
    );
}
