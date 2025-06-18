module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        //hostname: '**' is very unsecure!
        //replace with list of all hostnames you want to allow
        hostname: '**', // This wildcard matches any hostname
        // You can potentially add pathname if ALL your API image URLs share a common root path, e.g., '/images/**'
      },
    ],
  },
};