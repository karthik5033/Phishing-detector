import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Enable React strict mode for better development
  reactStrictMode: true,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Production source maps for debugging (optional, disable for smaller bundles)
  productionBrowserSourceMaps: false,
  
  // Typescript strict mode
  typescript: {
    // Allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib', 'types'],
    // Don't fail build on ESLint errors (optional)
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
