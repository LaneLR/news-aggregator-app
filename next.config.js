/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("sequelize", "pg");
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", //WARNING: This is highly insecure for production.
      },
    ],
  },
  compiler: {
    styledComponents: true, //enable the styled-components SWC compiler
  },
};

module.exports = nextConfig;