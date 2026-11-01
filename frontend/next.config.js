/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_EXPORT === "1" ? "export" : (process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
