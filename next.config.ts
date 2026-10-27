import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  // Legacy category URLs: .NET content moved from /dotnet → /backend and
  // Cloud content from /cloud → /devops. Keep old links working.
  async redirects() {
    return [
      { source: '/dotnet/:path*', destination: '/backend/:path*', permanent: true },
      { source: '/cloud/:path*', destination: '/devops/:path*', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.sqlservertutorial.net',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  // Types are checked by `yarn typecheck`, not by `next build`.
  // Next's build-time `tsc` pass re-checks the whole project (including the
  // ~20 MB generated content graph) and costs several minutes on every build.
  // `yarn typecheck` is now the only type gate — always run it before shipping.
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  experimental: {
    staticGenerationMaxConcurrency: 8,
    // The server bundle is dominated by lesson JSON. Minifying it takes Terser
    // minutes (single 7 MB chunk) and saves almost nothing on data, while the
    // browser bundle (the part users download) stays minified regardless.
    serverMinification: false,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
    ];
  },
};

const pwaConfig = {
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== 'true',
  maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
};

export default withPWA(pwaConfig)(nextConfig);
