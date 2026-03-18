/** @type {import('next').NextConfig} */
// CTS v3.2 - Stable webpack build, CSS-compatible
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
  productionBrowserSourceMaps: false,
  compress: true,
}

export default nextConfig
