import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { GET } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/auth/verify/sometoken");
}

function signToken(payload, opts) {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET, opts);
}

describe("GET /api/auth/verify/[token]", () => {
  beforeEach(() => {
    db.User.findByPk.mockReset();
  });

  it("rejects a garbage token", async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ token: "garbage" }) });

    expect(res.status).toBe(400);
  });

  it("rejects a token with the wrong purpose", async () => {
    const token = signToken({ id: "user-1", purpose: "reset-password" });

    const res = await GET(makeRequest(), { params: Promise.resolve({ token }) });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    const token = signToken({ id: "user-1", purpose: "verify-email" });
    db.User.findByPk.mockResolvedValue(null);

    const res = await GET(makeRequest(), { params: Promise.resolve({ token }) });

    expect(res.status).toBe(404);
  });

  it("marks the user verified and redirects to login on success", async () => {
    const token = signToken({ id: "user-1", purpose: "verify-email" });
    const user = createInstanceMock({ id: "user-1", emailIsVerified: false });
    db.User.findByPk.mockResolvedValue(user);

    const res = await GET(makeRequest(), { params: Promise.resolve({ token }) });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?verified=1");
    expect(user.emailIsVerified).toBe(true);
    expect(user.save).toHaveBeenCalled();
  });
});
