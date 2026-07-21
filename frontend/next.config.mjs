import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self)'
  }
];

/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, './'),
  turbopack: {
    root: path.join(__dirname, './'),
  },
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['*'],
  async headers() {
    const noCacheHeaders = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
      },
      {
        key: 'Pragma',
        value: 'no-cache'
      },
      {
        key: 'Expires',
        value: '0'
      }
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/dashboard/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/vault/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/sbt-gallery/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/billing/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/profile/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/settings/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/admin/:path*',
        headers: noCacheHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://meta-go.onrender.com/:path*'
      },
      {
        source: '/api/ws/proxy/:path*',
        destination: 'https://meta-go.onrender.com/:path*'
      }
    ];
  },
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      { module: /node_modules\/web-worker/ },
      { module: /node_modules\/ffjavascript/ },
      { message: /Can't resolve '@react-native-async-storage\/async-storage'/ }
    ];

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        readline: false,
        child_process: false,
        worker_threads: false,
        net: false,
        tls: false,
        '@react-native-async-storage/async-storage': false,
      };
    }
    return config;
  },
};

export default bundleAnalyzer(nextConfig);
