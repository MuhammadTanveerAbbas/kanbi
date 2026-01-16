import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
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
    };
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
};

export default nextConfig;
