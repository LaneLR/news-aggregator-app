import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db.js", () => ({ default: vi.fn(async () => db) }));

const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limiter", () => ({
  authRateLimitMiddleware: (...args) => mockRateLimit(...args),
}));

const mockSendEmail = vi.fn();
vi.mock("@/utils/emailer", () => ({ sendEmail: (...args) => mockSendEmail(...args) }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/register", () => {
  beforeEach(() => {
    mockRateLimit.mockReset().mockResolvedValue(undefined);
    mockSendEmail.mockReset().mockResolvedValue(undefined);
    db.User.findOne.mockReset();
    db.User.create.mockReset();
    db.Archive.findOrCreate.mockReset().mockResolvedValue([{}, true]);
  });

  it("propagates a rate-limit rejection", async () => {
    const err = new Error("Too many requests. Please try again after some time.");
    err.status = 429;
    mockRateLimit.mockRejectedValue(err);

    const res = await POST(makeRequest({ email: "a@example.com", password: "password1" }));

    expect(res.status).toBe(429);
  });

  it("rejects a missing email or password", async () => {
    const res = await POST(makeRequest({ email: "a@example.com" }));

    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "password1" }));

    expect(res.status).toBe(400);
  });

  it("rejects a too-short password", async () => {
    const res = await POST(makeRequest({ email: "a@example.com", password: "abc" }));

    expect(res.status).toBe(400);
  });

  it("rejects registration when the email is already in use", async () => {
    db.User.findOne.mockResolvedValue(createInstanceMock({ email: "a@example.com" }));

    const res = await POST(makeRequest({ email: "a@example.com", password: "password1" }));

    expect(res.status).toBe(409);
  });

  it("creates the user, an initial archive, sends a verification email, and returns 201", async () => {
    db.User.findOne.mockResolvedValue(null);
    const newUser = createInstanceMock({
      id: "user-1",
      email: "a@example.com",
      password: "hashed",
      referralCode: "ABCD1234",
    });
    db.User.create.mockResolvedValue(newUser);

    const res = await POST(makeRequest({ email: "a@example.com", password: "password1" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.user.password).toBeUndefined();
    expect(body.user.email).toBe("a@example.com");
    expect(db.Archive.findOrCreate).toHaveBeenCalledWith({
      where: { userId: "user-1", name: "Saved for later" },
    });
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@example.com", subject: expect.stringContaining("Verify") })
    );
  });

  it("returns 409 on a race-condition unique constraint violation", async () => {
    db.User.findOne.mockResolvedValue(null);
    const err = new Error("duplicate");
    err.name = "SequelizeUniqueConstraintError";
    db.User.create.mockRejectedValue(err);

    const res = await POST(makeRequest({ email: "a@example.com", password: "password1" }));

    expect(res.status).toBe(409);
  });

  it("returns 500 on an unexpected error", async () => {
    db.User.findOne.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ email: "a@example.com", password: "password1" }));

    expect(res.status).toBe(500);
  });
});
