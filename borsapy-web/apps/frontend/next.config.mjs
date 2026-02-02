/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable static page generation completely
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
