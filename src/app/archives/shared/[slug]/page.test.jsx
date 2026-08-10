import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDbMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => mockNotFound() }));

const { default: SharedArchivePage, generateMetadata } = await import("./page");

function makeParams(slug) {
  return { params: Promise.resolve({ slug }) };
}

describe("SharedArchivePage", () => {
  beforeEach(() => {
    db.Archive.findOne.mockReset();
  });

  it("queries by publicSlug and isPublic: true", async () => {
    db.Archive.findOne.mockResolvedValue({
      name: "Shared list",
      SavedArticles: [],
    });

    await SharedArchivePage(makeParams("abc123"));

    expect(db.Archive.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { publicSlug: "abc123", isPublic: true } })
    );
  });

  it("calls notFound when no public archive matches the slug", async () => {
    db.Archive.findOne.mockResolvedValue(null);

    await expect(SharedArchivePage(makeParams("missing"))).rejects.toThrow("NOT_FOUND");
  });

  it("renders an empty message when the archive has no saved articles", async () => {
    db.Archive.findOne.mockResolvedValue({ name: "Empty share", SavedArticles: [] });

    const element = await SharedArchivePage(makeParams("empty"));
    render(element);

    expect(screen.getByText("Empty share")).toBeInTheDocument();
    expect(
      screen.getByText("This archive doesn't have any saved articles yet.")
    ).toBeInTheDocument();
  });

  it("renders articles sorted newest-first with image-proxied thumbnails", async () => {
    db.Archive.findOne.mockResolvedValue({
      name: "My picks",
      SavedArticles: [
        {
          toJSON: () => ({
            id: "old",
            title: "Older article",
            url: "https://example.com/old",
            sourceName: "Old Source",
            urlToImage: "https://example.com/old.jpg",
            createdAt: "2026-01-01T00:00:00.000Z",
          }),
        },
        {
          toJSON: () => ({
            id: "new",
            title: "Newer article",
            url: "https://example.com/new",
            sourceName: "New Source",
            urlToImage: null,
            createdAt: "2026-02-01T00:00:00.000Z",
          }),
        },
      ],
    });

    const element = await SharedArchivePage(makeParams("picks"));
    render(element);

    const titles = screen.getAllByRole("heading", { level: 2 }).map((el) => el.textContent);
    expect(titles).toEqual(["Newer article", "Older article"]);

    // alt="" makes these decorative/presentational, so they're excluded
    // from the accessible role tree — query the DOM directly instead.
    const images = document.querySelectorAll("img");
    // Sorted newest-first: the newer article has no urlToImage (fallback
    // image), the older article has one (routed through the image proxy).
    // next/image rewrites src through its optimizer and URL-encodes it.
    expect(images[0].src).toContain("blurimage.png");
    expect(images[1].src).toContain(encodeURIComponent("/api/image-proxy?url="));
  });

  describe("generateMetadata", () => {
    it("returns an empty object when the archive doesn't exist", async () => {
      db.Archive.findOne.mockResolvedValue(null);

      const meta = await generateMetadata(makeParams("missing"));

      expect(meta).toEqual({});
    });

    it("builds title/description/openGraph from the archive", async () => {
      db.Archive.findOne.mockResolvedValue({
        name: "Cool reads",
        SavedArticles: [
          { toJSON: () => ({}), urlToImage: "https://example.com/first.jpg" },
          { toJSON: () => ({}), urlToImage: null },
        ],
      });

      const meta = await generateMetadata(makeParams("cool"));

      expect(meta.title).toBe("Cool reads");
      expect(meta.description).toMatch(/2 saved articles/);
      expect(meta.alternates.canonical).toContain("/archives/shared/cool");
      expect(meta.openGraph.images).toEqual([{ url: "https://example.com/first.jpg" }]);
    });

    it("uses singular wording for exactly one saved article", async () => {
      db.Archive.findOne.mockResolvedValue({
        name: "One read",
        SavedArticles: [{ toJSON: () => ({}), urlToImage: null }],
      });

      const meta = await generateMetadata(makeParams("one"));

      expect(meta.description).toMatch(/1 saved article\./);
    });
  });
});
