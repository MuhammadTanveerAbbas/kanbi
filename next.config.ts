import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const productionSecurityHeaders = [
  ...securityHeaders,
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.groq.com https://api.notion.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  turbopack: {
    resolveAlias: {},
  },
  experimental: {
    proxyTimeout: 30_000,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/handlebars/ },
        { module: /node_modules\/dotprompt/ },
        { module: /node_modules\/@genkit-ai/ },
        { module: /node_modules\/genkit/ },
      ];
    }
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
    return [
      {
        source: '/(.*)',
        headers: process.env.NODE_ENV === 'production' ? productionSecurityHeaders : securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
