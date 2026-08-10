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
  return new NextRequest("http://localhost/api/users/watchlist", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/watchlist", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ symbols: ["AAPL"] }));

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await PATCH(makeRequest({ symbols: ["AAPL"] }));

    expect(res.status).toBe(403);
  });

  it("rejects a non-array symbols payload", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await PATCH(makeRequest({ symbols: "AAPL" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the session user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ symbols: ["AAPL"] }));

    expect(res.status).toBe(404);
  });

  it("normalizes, dedupes, and caps symbols, then saves them", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const user = createInstanceMock({ id: "user-1" });
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(
      makeRequest({ symbols: ["aapl", "AAPL", " msft ", "not valid!", "TSLA", "GOOG", "AMZN", "NVDA", "META", "NFLX"] })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    // aapl/AAPL dedupe to one; "not valid!" is rejected by SYMBOL_PATTERN;
    // the remaining 8 valid symbols get capped at MAX_SYMBOLS (8).
    expect(body.symbols).toEqual(["AAPL", "MSFT", "TSLA", "GOOG", "AMZN", "NVDA", "META", "NFLX"]);
    expect(user.update).toHaveBeenCalledWith({ watchlistSymbols: body.symbols });
  });

  it("accepts a share-class ticker like BRK.B", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const user = createInstanceMock({ id: "user-1" });
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makeRequest({ symbols: ["BRK.B"] }));
    const body = await res.json();

    expect(body.symbols).toEqual(["BRK.B"]);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ symbols: ["AAPL"] }));

    expect(res.status).toBe(500);
  });
});
