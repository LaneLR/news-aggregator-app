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

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print upload logs in CI, not on every local build.
  silent: !process.env.CI,

  // Wider source map upload for readable stack traces from node_modules
  // too — increases build time slightly, worth it for a solo-maintained app
  // where a readable stack trace saves more time than the build costs.
  widenClientFileUpload: true,

  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
