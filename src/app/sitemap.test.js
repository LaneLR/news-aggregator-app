import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { default: sitemap } = await import("./sitemap");

describe("sitemap", () => {
  beforeEach(() => {
    db.Article.findAll.mockReset();
    db.Archive.findAll.mockReset();
  });

  // vi.stubEnv isn't cleared by vitest.setup.js's global afterEach (it only
  // unstubs globals), so undo it locally to avoid leaking DATABASE_URL: ""
  // into later tests in this file.
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns only static + free-category entries when DATABASE_URL isn't set (e.g. a secrets-less CI build)", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const entries = await sitemap();

    expect(db.Article.findAll).not.toHaveBeenCalled();
    expect(entries.some((e) => e.url.endsWith("/"))).toBe(true);
    expect(entries.some((e) => e.url.endsWith("/category/business"))).toBe(true);
    // Gated categories never appear even in the static fallback list.
    expect(entries.some((e) => e.url.endsWith("/category/finance"))).toBe(false);
  });

  it("includes recent articles and public archives when DATABASE_URL is set", async () => {
    db.Article.findAll.mockResolvedValue([
      { id: "a1", publishedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" },
    ]);
    db.Archive.findAll.mockResolvedValue([
      { publicSlug: "cool-picks", updatedAt: "2026-01-03T00:00:00.000Z" },
    ]);

    const entries = await sitemap();

    expect(db.Article.findAll).toHaveBeenCalled();
    expect(entries.some((e) => e.url.endsWith("/article/a1"))).toBe(true);
    expect(entries.some((e) => e.url.endsWith("/archives/shared/cool-picks"))).toBe(true);
  });

  it("excludes gated categories from the free-category static entries", async () => {
    db.Article.findAll.mockResolvedValue([]);
    db.Archive.findAll.mockResolvedValue([]);

    const entries = await sitemap();

    expect(entries.some((e) => e.url.includes("/category/market"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/category/journal"))).toBe(false);
  });
});
