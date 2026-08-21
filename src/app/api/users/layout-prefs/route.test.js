import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET, PATCH } = await import("./route");

function makePatchRequest(body) {
  return new NextRequest("http://localhost/api/users/layout-prefs", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("GET /api/users/layout-prefs", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("returns the reader default for anonymous visitors instead of erroring", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.viewDensity).toBe("reader");
  });

  it("returns 404 when the signed-in user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("returns the signed-in user's saved density", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue({ viewDensity: "list" });

    const res = await GET();
    const body = await res.json();

    expect(body.viewDensity).toBe("list");
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/users/layout-prefs", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ viewDensity: "card" }));

    expect(res.status).toBe(401);
  });

  it("rejects an invalid density", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(makePatchRequest({ viewDensity: "compact" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ viewDensity: "card" }));

    expect(res.status).toBe(404);
  });

  it("saves a valid density", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makePatchRequest({ viewDensity: "list" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.viewDensity).toBe("list");
    expect(user.update).toHaveBeenCalledWith({ viewDensity: "list" });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makePatchRequest({ viewDensity: "card" }));

    expect(res.status).toBe(500);
  });
});
