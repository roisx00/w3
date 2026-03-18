import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile photos
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Firebase Storage
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com', // Twitter/X profile images
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // KOL demo avatars
      },
    ],
  },
};

export default nextConfig;
