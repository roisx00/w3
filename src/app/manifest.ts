import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Web3 Hub',
        short_name: 'W3 Hub',
        description: 'The elite decentralized workforce platform. Talent, Jobs & Airdrops.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0f',
        theme_color: '#00f2ff',
        categories: ['finance', 'productivity', 'social'],
        icons: [
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
            {
                src: '/icon.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/apple-icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    };
}
