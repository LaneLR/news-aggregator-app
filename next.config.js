/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  // This tells Next.js 16 you know you're using Webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "sequelize", "pg"];
    }
    return config;
  },
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;