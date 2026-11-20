import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    // Graceful handling for client-side canvas / pdfjs-dist
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
