/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("sequelize", "pg");
    }
    return config;
  },
  compiler: {
    styledComponents: true, //enable the styled-components SWC compiler
  },
};

module.exports = nextConfig;
