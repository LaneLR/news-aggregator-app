import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetMarketQuotes = vi.fn();
vi.mock("@/lib/marketData", () => ({
  getMarketQuotes: (...args) => mockGetMarketQuotes(...args),
}));

const { GET } = await import("./route");

describe("GET /api/market/indices", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetMarketQuotes.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(403);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await GET();

    expect(res.status).toBe(403);
  });

  it("returns market quotes for Subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetMarketQuotes.mockResolvedValue({
      quotes: [{ symbol: "SPY", price: 500 }],
      lastUpdated: "2026-01-01T00:00:00.000Z",
      configured: true,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.quotes).toHaveLength(1);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetMarketQuotes.mockRejectedValue(new Error("finnhub down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
