import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockSendEmail = vi.fn();
vi.mock("@/utils/emailer", () => ({ sendEmail: (...args) => mockSendEmail(...args) }));

const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limiter", () => ({
  authRateLimitMiddleware: (...args) => mockRateLimit(...args),
}));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/auth/send-verification", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/send-verification", () => {
  beforeEach(() => {
    mockRateLimit.mockReset().mockResolvedValue(undefined);
    mockSendEmail.mockReset();
    db.User.findOne.mockReset();
  });

  it("returns the rate limiter's status when the limit is exceeded", async () => {
    const err = new Error("Too many requests. Please try again after some time.");
    err.status = 429;
    mockRateLimit.mockRejectedValue(err);

    const res = await POST(makeRequest({ email: "a@b.com" }));

    expect(res.status).toBe(429);
  });

  it("returns a generic message for a nonexistent account (no enumeration)", async () => {
    db.User.findOne.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "nobody@b.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(body.message).toMatch(/needs verification/i);
  });

  it("returns the same generic message when the account is already verified", async () => {
    db.User.findOne.mockResolvedValue(createInstanceMock({ emailIsVerified: true }));

    const res = await POST(makeRequest({ email: "a@b.com" }));

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("sends a verification email for an unverified account", async () => {
    db.User.findOne.mockResolvedValue(
      createInstanceMock({ id: "user-1", email: "a@b.com", emailIsVerified: false })
    );

    const res = await POST(makeRequest({ email: "a@b.com" }));

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com", subject: "Verify your account" })
    );
  });

  it("returns 500 on an unexpected error", async () => {
    db.User.findOne.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ email: "a@b.com" }));

    expect(res.status).toBe(500);
  });
});
