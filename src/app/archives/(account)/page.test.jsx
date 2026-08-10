import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDbMock } from "@/test/dbMock";
import { makeArchive, makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

vi.mock("@/components/ArchivesGrid", () => ({
  default: (props) => <div data-testid="archives-grid">{JSON.stringify(props)}</div>,
}));

const { default: ArchivesPage, metadata } = await import("./page");

describe("ArchivesPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findAll.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(ArchivesPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("shapes archives with article counts, last-updated dates, and up to 4 thumbnail images", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const archive = makeArchive({ id: 1, name: "Reading list" });
    archive.SavedArticles = [
      { urlToImage: "https://example.com/1.jpg", createdAt: "2026-01-01T00:00:00.000Z" },
      { urlToImage: "https://example.com/2.jpg", createdAt: "2026-01-03T00:00:00.000Z" },
      { urlToImage: null, createdAt: "2026-01-02T00:00:00.000Z" },
    ];
    db.Archive.findAll.mockResolvedValue([archive]);

    const element = await ArchivesPage();
    render(element);

    expect(db.Archive.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );

    const props = JSON.parse(screen.getByTestId("archives-grid").textContent);
    expect(props.archives).toHaveLength(1);
    expect(props.archives[0]).toMatchObject({
      id: 1,
      name: "Reading list",
      articleCount: 3,
      articleImages: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    });
    // lastUpdated should reflect the most recent saved article (Jan 3)
    expect(props.archives[0].lastUpdated).toBe(new Date("2026-01-03T00:00:00.000Z").toLocaleDateString());
  });

  it("falls back to the archive's own createdAt when it has no saved articles", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const archive = makeArchive({ id: 2, name: "Empty", createdAt: "2026-02-01T00:00:00.000Z" });
    archive.SavedArticles = [];
    db.Archive.findAll.mockResolvedValue([archive]);

    const element = await ArchivesPage();
    render(element);

    const props = JSON.parse(screen.getByTestId("archives-grid").textContent);
    expect(props.archives[0].articleCount).toBe(0);
    expect(props.archives[0].articleImages).toEqual([]);
    expect(props.archives[0].lastUpdated).toBe(new Date("2026-02-01T00:00:00.000Z").toLocaleDateString());
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
