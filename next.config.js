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
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

module.exports = nextConfig;
