/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/images/**',
        search: '', 
      },
      {
        pathname: '/api/image-proxy/**',
      }
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
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
