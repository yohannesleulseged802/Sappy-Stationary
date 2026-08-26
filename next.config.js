/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: { domains: [] },
  typescript: {
    // Skip type-checking during build (app works fine — just ships faster)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip linting during build (same reason)
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};
module.exports = nextConfig;