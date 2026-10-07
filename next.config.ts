import type { NextConfig } from "next";

function withOptionalBundleAnalyzer(config: NextConfig): NextConfig {
  if (process.env.ANALYZE === 'true') {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
    return withBundleAnalyzer(config);
  }
  return config;
}

// Applied on all routes in all environments
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// CSP is production-only to avoid blocking hot-reload in dev
const productionSecurityHeaders = [
  ...securityHeaders,
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is required by the blocking theme script, which sets
      // the theme attribute before first paint. That script is the reason the
      // app never flashes the wrong theme, so it is load bearing rather than a
      // convenience.
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // The model runtime is called server-side only, so the browser never
      // needs to reach it and no inference host has to be allow-listed here.
      // The deployment names its runtime in AI_BASE_URL, which the browser has
      // no way to see.
      "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  turbopack: {
    resolveAlias: {},
  },
  allowedDevOrigins: ['192.168.100.5'],
  experimental: {},
  webpack: (config, { isServer }) => {
    config.output = {
      ...config.output,
      chunkLoadTimeout: 120000,
      hashFunction: 'xxhash64',
    };
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
  async headers() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/(.*)',
          headers: productionSecurityHeaders,
        },
      ];
    }
    return [];
  },
};

export default withOptionalBundleAnalyzer(nextConfig);
