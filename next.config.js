/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = {
        ...config.externals,
        "sequelize/lib/dialects": "commonjs sequelize/lib/dialects",
        mysql: "commonjs mysql",
        pg: "commonjs pg",
        sqlite3: "commonjs sqlite3",
        tedious: "commonjs tedious",
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // This wildcard matches any hostname
      },
    ],
  },
};

module.exports = nextConfig;
