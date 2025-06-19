/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      const currentExternals =
        typeof config.externals === "object" && config.externals !== null
          ? config.externals
          : {};

      config.externals = {
        ...currentExternals,
        sequelize: "commonjs sequelize",
        pg: "commonjs pg",
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", //Be aware: '**' for hostname is not recommended for production
      },
    ],
  },
};

module.exports = nextConfig;
