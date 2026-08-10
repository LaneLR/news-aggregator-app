import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetMostCoveredCompanies = vi.fn();
vi.mock("@/lib/mostCovered", () => ({
  getMostCoveredCompanies: (...args) => mockGetMostCoveredCompanies(...args),
}));

const { GET } = await import("./route");

describe("GET /api/market/most-covered", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetMostCoveredCompanies.mockReset();
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

  it("returns most-covered companies for Subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetMostCoveredCompanies.mockResolvedValue([
      { name: "Apple", ticker: "AAPL", count: 3 },
    ]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.companies).toHaveLength(1);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetMostCoveredCompanies.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
