import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET, POST } = await import("./route");

function makePostRequest(body) {
  return new NextRequest("http://localhost/api/feeds", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/feeds", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Feed.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await GET();

    expect(res.status).toBe(403);
  });

  it("returns the Subscribed user's feeds", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findAll.mockResolvedValue([{ id: 1, title: "Tech" }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ id: 1, title: "Tech" }]);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});

describe("POST /api/feeds", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Feed.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makePostRequest({ title: "Tech" }));

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await POST(makePostRequest({ title: "Tech" }));

    expect(res.status).toBe(403);
  });

  it("rejects a blank title", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await POST(makePostRequest({ title: "   " }));

    expect(res.status).toBe(400);
  });

  it("creates the feed for a Subscribed user", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.Feed.create.mockResolvedValue({ id: 2, title: "Tech" });

    const res = await POST(makePostRequest({ title: "Tech", sourceNames: ["CNN"] }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ id: 2, title: "Tech" });
    expect(db.Feed.create).toHaveBeenCalledWith({
      title: "Tech",
      sourceNames: ["CNN"],
      categories: [],
      userId: expect.any(String),
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.create.mockRejectedValue(new Error("db down"));

    const res = await POST(makePostRequest({ title: "Tech" }));

    expect(res.status).toBe(500);
  });
});
