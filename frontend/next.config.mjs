/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },
  turbopack: { root: import.meta.dirname },
  allowedDevOrigins: ['*'],
};
export default nextConfig;
