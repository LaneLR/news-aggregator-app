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
        // Subscriber-only category pages redirect anonymous/Free visitors to
        // /pricing, same as /news — a crawler never sees real content here.
        "/category/market",
        "/category/finance",
        "/category/journal",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
