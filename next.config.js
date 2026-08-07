/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // No `remotePatterns` — every third-party image is already routed
    // through /api/image-proxy, which has its own SSRF/private-IP
    // protections. Leaving a wildcard remote pattern here would let any
    // future `<Image src={externalUrl}>` silently bypass that proxy and
    // hit Next's own (unprotected) image fetcher instead.
    localPatterns: [
      {
        pathname: '/images/**',
        search: '',
      },
      {
        pathname: '/api/image-proxy/**',
      }
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "sequelize", "pg"];
    }
    return config;
  },
};

module.exports = nextConfig;
