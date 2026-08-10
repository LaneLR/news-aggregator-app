import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET, PATCH } = await import("./route");

function makeGetRequest() {
  return new NextRequest("http://localhost/api/users/digest-preferences");
}

function makePatchRequest(body) {
  return new NextRequest("http://localhost/api/users/digest-preferences", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("GET /api/users/digest-preferences", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("returns the user's digest preferences", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue({
      digestEnabled: true,
      digestFrequency: "daily",
      digestFeedId: "feed-1",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ digestEnabled: true, digestFrequency: "daily", digestFeedId: "feed-1" });
  });
});

describe("PATCH /api/users/digest-preferences", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
    db.Feed.findOne.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ digestEnabled: true }));

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ digestEnabled: true }));

    expect(res.status).toBe(404);
  });

  it("rejects an invalid digest frequency", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock());

    const res = await PATCH(makePatchRequest({ digestFrequency: "hourly" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the chosen digest feed doesn't belong to the user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock());
    db.Feed.findOne.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ digestFeedId: "feed-1" }));

    expect(res.status).toBe(404);
  });

  it("clears the digest feed when digestFeedId is explicitly null", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const user = createInstanceMock({ digestFeedId: "old-feed" });
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makePatchRequest({ digestFeedId: null }));

    expect(res.status).toBe(200);
    expect(user.update).toHaveBeenCalledWith({ digestFeedId: null });
  });

  it("updates enabled/frequency/feed together", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);
    db.Feed.findOne.mockResolvedValue(createInstanceMock({ id: "feed-1" }));

    const res = await PATCH(
      makePatchRequest({ digestEnabled: true, digestFrequency: "daily", digestFeedId: "feed-1" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(user.update).toHaveBeenCalledWith({
      digestEnabled: true,
      digestFrequency: "daily",
      digestFeedId: "feed-1",
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makePatchRequest({ digestEnabled: true }));

    expect(res.status).toBe(500);
  });
});
