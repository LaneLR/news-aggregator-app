import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession, makeUser } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db.js", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limiter", () => ({
  authRateLimitMiddleware: (...args) => mockRateLimit(...args),
}));

const mockStripe = {
  coupons: { list: vi.fn() },
  promotionCodes: { create: vi.fn() },
};
vi.mock("@/lib/stripe", () => ({ default: () => mockStripe }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/referral", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/referral", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRateLimit.mockReset().mockResolvedValue(undefined);
    db.User.findOne.mockReset();
    mockStripe.coupons.list.mockReset();
    mockStripe.promotionCodes.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ referralCode: "ABC123" }));

    expect(res.status).toBe(401);
  });

  it("propagates a rate-limit rejection", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const err = new Error("Too many requests. Please try again after some time.");
    err.status = 429;
    mockRateLimit.mockRejectedValue(err);

    const res = await POST(makeRequest({ referralCode: "ABC123" }));

    expect(res.status).toBe(429);
  });

  it("rejects a missing referral code", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("rejects an unknown referral code", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findOne.mockResolvedValue(null);

    const res = await POST(makeRequest({ referralCode: "NOPE" }));

    expect(res.status).toBe(404);
  });

  it("rejects a referral code from a Free-tier (non-active-subscriber) user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findOne.mockResolvedValue(makeUser({ id: "referrer-1", tier: "Free" }));

    const res = await POST(makeRequest({ referralCode: "REF1" }));

    expect(res.status).toBe(400);
  });

  it("rejects using your own referral code", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findOne.mockResolvedValue(makeUser({ id: "user-1", tier: "Subscribed" }));

    const res = await POST(makeRequest({ referralCode: "REF1" }));

    expect(res.status).toBe(400);
  });

  it("returns 500 when the referral coupon isn't configured in Stripe", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findOne.mockResolvedValue(makeUser({ id: "referrer-1", tier: "Subscribed" }));
    mockStripe.coupons.list.mockResolvedValue({ data: [] });

    const res = await POST(makeRequest({ referralCode: "REF1" }));

    expect(res.status).toBe(500);
  });

  it("creates a single-use promotion code on success", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findOne.mockResolvedValue(makeUser({ id: "referrer-1", tier: "Subscribed" }));
    mockStripe.coupons.list.mockResolvedValue({
      data: [{ id: "coupon-1", name: "Referral Discount" }],
    });
    mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo-1" });

    const res = await POST(makeRequest({ referralCode: "REF1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.promotionCodeId).toBe("promo-1");
    expect(mockStripe.promotionCodes.create).toHaveBeenCalledWith(
      expect.objectContaining({ coupon: "coupon-1", max_redemptions: 1 })
    );
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findOne.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ referralCode: "REF1" }));

    expect(res.status).toBe(500);
  });
});
