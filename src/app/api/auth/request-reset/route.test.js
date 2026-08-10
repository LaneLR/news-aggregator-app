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
  return new NextRequest("http://localhost/api/auth/request-reset", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/request-reset", () => {
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

  it("returns a generic success message even when the account doesn't exist (no enumeration)", async () => {
    db.User.findOne.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "nobody@b.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toMatch(/password reset link/i);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("bumps tokenVersion and sends a reset email for an existing user", async () => {
    const user = createInstanceMock({ id: "user-1", email: "a@b.com", tokenVersion: 0 });
    db.User.findOne.mockResolvedValue(user);

    const res = await POST(makeRequest({ email: "a@b.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Password reset email sent.");
    expect(user.tokenVersion).toBe(1);
    expect(user.save).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com", subject: "Reset your password" })
    );
  });

  it("returns 500 on an unexpected error", async () => {
    db.User.findOne.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ email: "a@b.com" }));

    expect(res.status).toBe(500);
  });
});
