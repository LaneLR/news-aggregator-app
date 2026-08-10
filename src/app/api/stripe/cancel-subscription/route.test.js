import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockStripe = { subscriptions: { update: vi.fn() } };
vi.mock("@/lib/stripe", () => ({ default: () => mockStripe }));

const { POST } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/stripe/cancel-subscription", { method: "POST" });
}

describe("POST /api/stripe/cancel-subscription", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
    mockStripe.subscriptions.update.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user has no active subscription", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ stripeSubscriptionId: null }));

    const res = await POST(makeRequest());

    expect(res.status).toBe(404);
  });

  it("returns 404 when the user record itself is missing", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(null);

    const res = await POST(makeRequest());

    expect(res.status).toBe(404);
  });

  it("requests a cancel-at-period-end update from Stripe", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ stripeSubscriptionId: "sub_123" })
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith("sub_123", {
      cancel_at_period_end: true,
    });
  });

  it("returns 500 when Stripe errors", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ stripeSubscriptionId: "sub_123" })
    );
    mockStripe.subscriptions.update.mockRejectedValue(new Error("stripe down"));

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });
});
