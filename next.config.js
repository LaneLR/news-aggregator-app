/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost", // Use 'localhost' as the hostname
        port: "3000", // Specify the port separately
        pathname: "/api/image-proxy/**",
      },
      // You can also add other hostnames here to avoid the proxy for known domains
      {
        protocol: "https",
        hostname: "cdn.cnn.com",
      },
      // Add other domains as needed
    ],
  },
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
