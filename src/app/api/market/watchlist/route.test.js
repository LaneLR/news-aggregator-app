import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetWatchlistQuotes = vi.fn();
vi.mock("@/lib/marketData", () => ({
  getWatchlistQuotes: (...args) => mockGetWatchlistQuotes(...args),
}));

const { GET } = await import("./route");

describe("GET /api/market/watchlist", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetWatchlistQuotes.mockReset();
    db.User.findByPk.mockReset();
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

  it("returns watchlist quotes using the user's saved symbols", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.User.findByPk.mockResolvedValue({ watchlistSymbols: ["AAPL", "MSFT"] });
    mockGetWatchlistQuotes.mockResolvedValue({
      quotes: [{ symbol: "AAPL", price: 200 }],
      lastUpdated: "2026-01-01T00:00:00.000Z",
      configured: true,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.symbols).toEqual(["AAPL", "MSFT"]);
    expect(mockGetWatchlistQuotes).toHaveBeenCalledWith(db.MarketQuote, ["AAPL", "MSFT"]);
  });

  it("defaults to an empty symbol list when the user has none saved", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.User.findByPk.mockResolvedValue({ watchlistSymbols: null });
    mockGetWatchlistQuotes.mockResolvedValue({ quotes: [], lastUpdated: null, configured: true });

    const res = await GET();
    const body = await res.json();

    expect(body.symbols).toEqual([]);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
