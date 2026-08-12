const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/archives/shared/"],
      disallow: [
        "/api/",
        "/account/",
        "/settings",
        "/feeds",
        "/liked",
        "/following",
        "/share",
        "/for-you",
        "/onboarding",
        "/archives",
        "/verification/",
        "/password-reset",
        "/forgot-password",
        "/news",
        "/search",
        // Market/Journal show a real upsell teaser page to anonymous/Free
        // visitors now (see GatedCategoryTeaser), not a redirect, so they're
        // legitimately crawlable/indexable — same treatment as /pricing.
        // Finance is no longer fully gated at all (see
        // subscriberOnlyCategories.js), so it isn't listed here either.
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
