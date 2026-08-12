import { describe, expect, it } from "vitest";

const { default: robots } = await import("./robots");

describe("robots", () => {
  it("allows crawling the homepage and shared archives", () => {
    const config = robots();

    expect(config.rules.userAgent).toBe("*");
    expect(config.rules.allow).toEqual(["/", "/archives/shared/"]);
  });

  it("disallows private/account-gated routes", () => {
    const config = robots();

    expect(config.rules.disallow).toEqual(
      expect.arrayContaining([
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
      ])
    );
  });

  it("does not disallow any category pages — Market/Journal show an indexable teaser now, and Finance/Podcast were never redirect-gated", () => {
    const config = robots();

    expect(config.rules.disallow).not.toEqual(
      expect.arrayContaining(["/category/market", "/category/finance", "/category/journal"])
    );
  });

  it("points at the sitemap using NEXT_PUBLIC_BASE_URL", () => {
    const config = robots();

    expect(config.sitemap).toBe(`${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`);
  });
});
