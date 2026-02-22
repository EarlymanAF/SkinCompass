import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    devtoolSegmentExplorer: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'community.cloudflare.steamstatic.com',
      },
    ],
  },
};

export default nextConfig;
