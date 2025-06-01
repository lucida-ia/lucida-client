/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      enable: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
