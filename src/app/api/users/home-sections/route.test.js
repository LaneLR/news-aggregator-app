import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { PATCH } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/users/home-sections", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/home-sections", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ homeSections: ["forYou"] }));

    expect(res.status).toBe(401);
  });

  it("rejects a non-array payload", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(makeRequest({ homeSections: "forYou" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ homeSections: ["forYou"] }));

    expect(res.status).toBe(404);
  });

  it("drops unknown keys and gated categories for Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(
      makeRequest({ homeSections: ["forYou", "Market", "Business", "notARealSection"] })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.homeSections).toEqual(["forYou", "Business"]);
  });

  it("keeps gated categories for Subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makeRequest({ homeSections: ["forYou", "Market"] }));
    const body = await res.json();

    expect(body.homeSections).toEqual(["forYou", "Market"]);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ homeSections: ["forYou"] }));

    expect(res.status).toBe(500);
  });
});
