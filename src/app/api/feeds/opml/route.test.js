import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

describe("GET /api/feeds/opml", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Feed.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("exports the user's feeds as OPML XML", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Feed.findAll.mockResolvedValue([
      { title: "Tech", sourceNames: ["CNN"], categories: ["Business"] },
    ]);

    const res = await GET();
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/x-opml");
    expect(text).toContain("<opml");
    expect(text).toContain('text="Tech"');
    expect(text).toContain('text="CNN"');
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Feed.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
