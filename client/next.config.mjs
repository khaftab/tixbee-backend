/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // except for webpack, other parts are left as generated
  webpack: (config, context) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300
    }
    return config
  }
}
export default nextConfig

// This configuration will enable polling in development mode, which will make the file system check for changes every second. https://github.com/vercel/next.js/issues/36774#issuecomment-1211818610