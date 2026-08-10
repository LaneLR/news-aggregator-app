import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { PATCH, DELETE } = await import("./route");

function makePatchRequest(body) {
  return new NextRequest("http://localhost/api/feeds/1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
function makeDeleteRequest() {
  return new NextRequest("http://localhost/api/feeds/1", { method: "DELETE" });
}

describe("PATCH /api/feeds/[feedId]", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Feed.findOne.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ title: "Tech" }), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await PATCH(makePatchRequest({ title: "Tech" }), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(403);
  });

  it("rejects a blank title", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await PATCH(makePatchRequest({ title: "" }), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the feed isn't the user's, correctly awaiting params", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ title: "Tech" }), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(404);
    expect(db.Feed.findOne).toHaveBeenCalledWith({
      where: { id: "1", userId: expect.any(String) },
    });
  });

  it("updates the feed on success", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const feed = createInstanceMock({ id: 1, title: "Old" });
    db.Feed.findOne.mockResolvedValue(feed);

    const res = await PATCH(makePatchRequest({ title: "New", sourceNames: ["CNN"] }), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(200);
    expect(feed.update).toHaveBeenCalledWith({
      title: "New",
      sourceNames: ["CNN"],
      categories: [],
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makePatchRequest({ title: "Tech" }), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/feeds/[feedId]", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Feed.findOne.mockReset();
    db.User.update.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(403);
  });

  it("returns 404 when the feed isn't the user's", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(404);
  });

  it("deletes the feed and clears digestFeedId, correctly awaiting params", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const feed = createInstanceMock({ id: 1 });
    db.Feed.findOne.mockResolvedValue(feed);

    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(200);
    expect(feed.destroy).toHaveBeenCalled();
    expect(db.User.update).toHaveBeenCalledWith(
      { digestFeedId: null },
      { where: { id: expect.any(String), digestFeedId: "1" } }
    );
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockRejectedValue(new Error("db down"));

    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(500);
  });
});
