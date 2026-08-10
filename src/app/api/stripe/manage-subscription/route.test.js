import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockStripe = { billingPortal: { sessions: { create: vi.fn() } } };
vi.mock("@/lib/stripe", () => ({ default: () => mockStripe }));

const { POST } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/stripe/manage-subscription", { method: "POST" });
}

describe("POST /api/stripe/manage-subscription", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
    mockStripe.billingPortal.sessions.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user has no Stripe customer id", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ stripeCustomerId: null }));

    const res = await POST(makeRequest());

    expect(res.status).toBe(404);
  });

  it("creates a billing portal session and returns its url", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ stripeCustomerId: "cus_123" }));
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/xyz",
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://billing.stripe.com/session/xyz");
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_123" })
    );
  });

  it("returns 500 when Stripe errors", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ stripeCustomerId: "cus_123" }));
    mockStripe.billingPortal.sessions.create.mockRejectedValue(new Error("stripe down"));

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });
});
