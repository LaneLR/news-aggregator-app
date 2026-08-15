import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET, POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/users/followed-sources", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/users/followed-sources", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns the user's followed sources", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(createInstanceMock({ followedSources: ["Reuters"] }));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.followedSources).toEqual(["Reuters"]);
  });

  it("returns an empty array when the user has no followed sources", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(createInstanceMock({ followedSources: null }));

    const res = await GET();
    const body = await res.json();

    expect(body.followedSources).toEqual([]);
  });
});

describe("POST /api/users/followed-sources", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ sourceName: "Reuters" }));

    expect(res.status).toBe(401);
  });

  it("rejects a request with no sourceName", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await POST(makeRequest({ sourceName: "Reuters" }));

    expect(res.status).toBe(404);
  });

  it("follows a source not already followed", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock({ followedSources: [] });
    db.User.findByPk.mockResolvedValue(user);

    const res = await POST(makeRequest({ sourceName: "Reuters" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.following).toBe(true);
    expect(body.followedSources).toEqual(["Reuters"]);
    expect(user.update).toHaveBeenCalledWith(
      { followedSources: ["Reuters"] },
      expect.objectContaining({ transaction: expect.anything() })
    );
  });

  it("unfollows a source that's already followed", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock({ followedSources: ["Reuters", "BBC"] });
    db.User.findByPk.mockResolvedValue(user);

    const res = await POST(makeRequest({ sourceName: "Reuters" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.following).toBe(false);
    expect(body.followedSources).toEqual(["BBC"]);
    expect(user.update).toHaveBeenCalledWith(
      { followedSources: ["BBC"] },
      expect.objectContaining({ transaction: expect.anything() })
    );
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ sourceName: "Reuters" }));

    expect(res.status).toBe(500);
  });
});
