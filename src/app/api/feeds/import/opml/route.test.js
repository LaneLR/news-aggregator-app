import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
db.Article.sequelize = {
  fn: (...args) => args,
  col: (name) => name,
};
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/feeds/import/opml", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const VALID_OPML = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>Feeds</title></head>
  <body>
    <outline text="Folder">
      <outline text="CNN" />
    </outline>
  </body>
</opml>`;

describe("POST /api/feeds/import/opml", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Article.findAll.mockReset();
    db.Feed.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ opmlText: VALID_OPML }));

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await POST(makeRequest({ opmlText: VALID_OPML }));

    expect(res.status).toBe(403);
  });

  it("rejects a missing opmlText", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("rejects malformed XML", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await POST(makeRequest({ opmlText: "<<not xml" }));

    expect(res.status).toBe(400);
  });

  it("rejects OPML with no outlines", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await POST(
      makeRequest({ opmlText: `<opml><head></head><body></body></opml>` })
    );

    expect(res.status).toBe(400);
  });

  it("rejects when none of the imported sources are known", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Article.findAll.mockResolvedValue([{ sourceName: "BBC" }]);

    const res = await POST(makeRequest({ opmlText: VALID_OPML }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.skipped).toContain("CNN");
  });

  it("creates a feed from matched sources on success", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.Article.findAll.mockResolvedValue([{ sourceName: "CNN" }]);
    db.Feed.create.mockResolvedValue({ id: 1, title: "Imported Feed", sourceNames: ["CNN"] });

    const res = await POST(makeRequest({ opmlText: VALID_OPML }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.matchedCount).toBe(1);
    expect(db.Feed.create).toHaveBeenCalledWith({
      title: "Imported Feed",
      sourceNames: ["CNN"],
      categories: [],
      userId: "user-1",
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Article.findAll.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ opmlText: VALID_OPML }));

    expect(res.status).toBe(500);
  });
});
