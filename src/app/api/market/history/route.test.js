import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetChartRange = vi.fn();
vi.mock("@/lib/chartData", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getChartRange: (...args) => mockGetChartRange(...args) };
});

const { GET } = await import("./route");

function makeRequest(qs = "") {
  return new NextRequest(`http://localhost/api/market/history${qs ? `?${qs}` : ""}`);
}

describe("GET /api/market/history", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetChartRange.mockReset();
  });

  it("rejects Free-tier (and unauthenticated) users", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(403);
  });

  it("rejects Free-tier users explicitly", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await GET(makeRequest());

    expect(res.status).toBe(403);
  });

  it("rejects an unknown index symbol", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await GET(makeRequest("symbol=NOTREAL"));

    expect(res.status).toBe(400);
  });

  it("rejects an unknown range", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await GET(makeRequest("symbol=SPY&range=99y"));

    expect(res.status).toBe(400);
  });

  it("returns chart data for a valid subscribed request", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetChartRange.mockResolvedValue({
      points: [{ t: "2026-01-01T00:00:00.000Z", price: 500 }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const res = await GET(makeRequest("symbol=spy&range=1mo"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.symbol).toBe("SPY");
    expect(body.range).toBe("1mo");
    expect(body.points).toHaveLength(1);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetChartRange.mockRejectedValue(new Error("yahoo down"));

    const res = await GET(makeRequest("symbol=SPY&range=1mo"));

    expect(res.status).toBe(500);
  });
});
