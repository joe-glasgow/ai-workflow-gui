/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Remove deprecated appDir - it's enabled by default in Next.js 14
  },
  // Ensure API routes work in production
  trailingSlash: false,
  // Optimize for App Runner deployment
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
