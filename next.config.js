/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3i6fh83elv35t.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "cdn.cnn.com",
      },
      {
        protocol: "https",
        hostname: "media-cldnry.s-nbcnews.com",
      },
      {
        protocol: "https",
        hostname: "s.abcnews.com",
      },
      {
        protocol: "https",
        hostname: "ichef.bbci.co.uk",
      },
      {
        protocol: "https",
        hostname: "cdn.arstechnica.net",
      },
      {
        protocol: "https",
        hostname: "media.breitbart.com",
      },
      {
        protocol: "https",
        hostname: "img.buzzfeed.com",
      },
      {
        protocol: "https",
        hostname: "i.cbc.ca",
      },
      {
        protocol: "https",
        hostname: "sportshub.cbsistatic.com",
      },
      {
        protocol: "https",
        hostname: "www.cnet.com",
      },
      {
        protocol: "https",
        hostname: "deadline.com",
      },
      {
        protocol: "https",
        hostname: "www.destructoid.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discovermagazine.com",
      },
      {
        protocol: "https",
        hostname: "o.aolcdn.com",
      },
      {
        protocol: "https",
        hostname: "assets.entrepreneur.com",
      },
      {
        protocol: "https",
        hostname: "hips.hearstapps.com",
      },
      {
        protocol: "https",
        hostname: "assetsio.gnwcdn.com",
      },
      {
        protocol: "https",
        hostname: "images.fastcompany.com",
      },
      {
        protocol: "https",
        hostname: "www.ft.com",
      },
      {
        protocol: "https",
        hostname: "fivethirtyeight.com",
      },
      {
        protocol: "https",
        hostname: "www.foodsafetynews.com",
      },
      {
        protocol: "https",
        hostname: "a57.foxnews.com",
      },
      {
        protocol: "https",
        hostname: "www.gameinformer.com",
      },
      {
        protocol: "https",
        hostname: "www.gamespot.com",
      },
      {
        protocol: "https",
        hostname: "cdn.mos.cms.futurecdn.net",
      },
      {
        protocol: "https",
        hostname: "www.giantbomb.com",
      },
      {
        protocol: "https",
        hostname: "gizmodo.com",
      },
      {
        protocol: "https",
        hostname: "media.glamour.com",
      },
      {
        protocol: "https",
        hostname: "grist.org",
      },
      {
        protocol: "https",
        hostname: "cdn.hswstatic.com",
      },
      {
        protocol: "https",
        hostname: "static1.howtogeekimages.com",
      },
      {
        protocol: "https",
        hostname: "spectrum.ieee.org",
      },
      {
        protocol: "https",
        hostname: "assets-prd.ignimgs.com",
      },
      {
        protocol: "https",
        hostname: "kffhealthnews.org",
      },
      {
        protocol: "https",
        hostname: "kotaku.com",
      },
      {
        protocol: "https",
        hostname: "lifehacker.com",
      },
      {
        protocol: "https",
        hostname: "helios-i.mashable.com",
      },
      {
        protocol: "https",
        hostname: "clf1.medpagetoday.com",
      },
      {
        protocol: "https",
        hostname: "static.independent.co.uk",
      },
      {
        protocol: "https",
        hostname: "images.wsj.net",
      },
      {
        protocol: "https",
        hostname: "static01.nyt.com",
      },
      {
        protocol: "https",
        hostname: "scx1.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "cdn.sci.news",
      },
      {
        protocol: "https",
        hostname: "www.popsci.com",
      },
      {
        protocol: "https",
        hostname: "i.guim.co.uk",
      },
      {
        protocol: "https",
        hostname: "a.fsdn.com",
      },
      {
        protocol: "https",
        hostname: "media.zenfs.com",
      },
      {
        protocol: "https",
        hostname: "static.toiimg.com",
      },

      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/image-proxy/**",
      },
    ],
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
