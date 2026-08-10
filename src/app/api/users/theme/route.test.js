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
  return new NextRequest("http://localhost/api/users/theme", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/theme", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ themeName: "dark" }));

    expect(res.status).toBe(401);
  });

  it("rejects an unknown theme name", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(makeRequest({ themeName: "solarized" }));

    expect(res.status).toBe(400);
  });

  it("accepts null as a deliberate 'follow system theme' value", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makeRequest({ themeName: null }));

    expect(res.status).toBe(200);
    expect(user.update).toHaveBeenCalledWith({ selectedTheme: null });
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ themeName: "dark" }));

    expect(res.status).toBe(404);
  });

  it("saves a valid theme", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makeRequest({ themeName: "dark" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(user.update).toHaveBeenCalledWith({ selectedTheme: "dark" });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ themeName: "dark" }));

    expect(res.status).toBe(500);
  });
});
