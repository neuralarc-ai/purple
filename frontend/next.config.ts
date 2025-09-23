import type { NextConfig } from 'next';

const nextConfig = (): NextConfig => ({
  output: (process.env.NEXT_OUTPUT as 'standalone') || undefined,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gdkwidkzbdwjtzgjezch.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  env: {
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    BACKEND_URL: process.env.BACKEND_URL,
    KORTIX_ADMIN_API_KEY: process.env.KORTIX_ADMIN_API_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://us.i.posthog.com/flags',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
});

export default nextConfig;
