import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/handlebars/ },
        { module: /node_modules\/dotprompt/ },
        { module: /node_modules\/@genkit-ai/ },
        { module: /node_modules\/genkit/ },
      ];
    }
    return config;
  },
};

export default nextConfig;
