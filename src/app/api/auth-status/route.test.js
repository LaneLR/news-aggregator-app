import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetToken = vi.fn();
vi.mock("next-auth/jwt", () => ({ getToken: (...args) => mockGetToken(...args) }));

const { GET } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/auth-status");
}

describe("GET /api/auth-status", () => {
  beforeEach(() => {
    mockGetToken.mockReset();
  });

  it("returns 401 isLoggedIn:false when there's no token", async () => {
    mockGetToken.mockResolvedValue(null);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.isLoggedIn).toBe(false);
  });

  it("returns 200 with the projected user fields when a token is present", async () => {
    mockGetToken.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      tier: "Subscribed",
      emailIsVerified: true,
      stripeSubscriptionStatus: "active",
      stripeSubscriptionEndsAt: null,
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      isLoggedIn: true,
      user: {
        id: "user-1",
        email: "a@b.com",
        tier: "Subscribed",
        emailIsVerified: true,
        stripeSubscriptionStatus: "active",
        stripeSubscriptionEndsAt: null,
      },
    });
  });
});
