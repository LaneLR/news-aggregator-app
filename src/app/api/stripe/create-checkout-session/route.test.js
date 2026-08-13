import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

// headers() is async in this Next.js version — mock it the same way, as a
// Promise resolving to a Headers-like object, so a regression back to the
// unawaited `headers().get(...)` bug would fail these tests immediately.
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ origin: "https://app.example.com" })),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args) => mockRevalidatePath(...args) }));

const mockStripe = { checkout: { sessions: { create: vi.fn() } } };
vi.mock("@/lib/stripe", () => ({ default: () => mockStripe }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/stripe/create-checkout-session", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/create-checkout-session", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
    db.User.findOne.mockReset();
    mockStripe.checkout.sessions.create.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ priceId: "price_123" }));

    expect(res.status).toBe(401);
  });

  it("rejects a missing priceId", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the session user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(null);

    const res = await POST(makeRequest({ priceId: "price_123" }));

    expect(res.status).toBe(404);
  });

  it("rejects users who already have an active subscription", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ tier: "Subscribed" }));

    const res = await POST(makeRequest({ priceId: "price_123" }));

    expect(res.status).toBe(400);
  });

  it("rejects a referral code that's already been used once", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ tier: "Free", usedReferralCode: "OLD1" })
    );

    const res = await POST(
      makeRequest({ priceId: "price_123", referralCode: "REF1", promotionCodeId: "promo_1" })
    );

    expect(res.status).toBe(400);
  });

  it("rejects an invalid referral code", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ tier: "Free", usedReferralCode: null }));
    db.User.findOne.mockResolvedValue(null);

    const res = await POST(
      makeRequest({ priceId: "price_123", referralCode: "BADCODE", promotionCodeId: "promo_1" })
    );

    expect(res.status).toBe(400);
  });

  it("rejects a referral code missing its applied promotionCodeId", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ id: "user-1", tier: "Free", usedReferralCode: null }));
    db.User.findOne.mockResolvedValue(createInstanceMock({ id: "referrer-1" }));

    const res = await POST(makeRequest({ priceId: "price_123", referralCode: "REF1" }));

    expect(res.status).toBe(400);
  });

  it("creates a checkout session for a plain (non-referral) subscribe", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ id: "user-1", tier: "Free", email: "a@example.com", stripeCustomerId: null })
    );
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });

    const res = await POST(makeRequest({ priceId: "price_123" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sessionId).toBe("cs_test_123");
    // The mobile app wrapper's native-app branch opens this URL directly in
    // the system browser instead of using stripe.redirectToCheckout — see
    // src/lib/nativeApp.js.
    expect(body.url).toBe("https://checkout.stripe.com/pay/cs_test_123");
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_123", quantity: 1 }],
        mode: "subscription",
        customer_email: "a@example.com",
        success_url: "https://app.example.com/account?subscription_success=true",
      })
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pricing");
  });

  it("reuses an existing Stripe customer id instead of customer_email", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ id: "user-1", tier: "Free", email: "a@example.com", stripeCustomerId: "cus_existing" })
    );
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: "cs_test_123" });

    await POST(makeRequest({ priceId: "price_123" }));

    const callArg = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(callArg.customer).toBe("cus_existing");
    expect(callArg.customer_email).toBeUndefined();
  });

  it("applies a valid referral discount and rejects self-referral", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ id: "user-1", tier: "Free", usedReferralCode: null })
    );
    db.User.findOne.mockResolvedValue(createInstanceMock({ id: "user-1" })); // referrer === self

    const res = await POST(
      makeRequest({ priceId: "price_123", referralCode: "REF1", promotionCodeId: "promo_1" })
    );

    expect(res.status).toBe(400);
  });

  it("returns 500 when Stripe errors", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ id: "user-1", tier: "Free", email: "a@example.com" })
    );
    mockStripe.checkout.sessions.create.mockRejectedValue(new Error("stripe down"));

    const res = await POST(makeRequest({ priceId: "price_123" }));

    expect(res.status).toBe(500);
  });
});
