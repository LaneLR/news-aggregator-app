import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function signToken(payload, opts) {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET, opts);
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    db.User.findByPk.mockReset();
  });

  it("rejects a garbage token", async () => {
    const res = await POST(makeRequest({ token: "not-a-jwt", newPassword: "newpass123" }));

    expect(res.status).toBe(400);
  });

  it("rejects a token with the wrong purpose", async () => {
    const token = signToken({ id: "user-1", purpose: "verify-email", v: 0 });

    const res = await POST(makeRequest({ token, newPassword: "newpass123" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    const token = signToken({ id: "user-1", purpose: "reset-password", v: 0 });
    db.User.findByPk.mockResolvedValue(null);

    const res = await POST(makeRequest({ token, newPassword: "newpass123" }));

    expect(res.status).toBe(404);
  });

  it("rejects an already-used (stale tokenVersion) reset link", async () => {
    const token = signToken({ id: "user-1", purpose: "reset-password", v: 0 });
    db.User.findByPk.mockResolvedValue(createInstanceMock({ id: "user-1", tokenVersion: 1 }));

    const res = await POST(makeRequest({ token, newPassword: "newpass123" }));

    expect(res.status).toBe(400);
  });

  it("updates the password and invalidates the link on success", async () => {
    const token = signToken({ id: "user-1", purpose: "reset-password", v: 0 });
    const user = createInstanceMock({ id: "user-1", tokenVersion: 0 });
    db.User.findByPk.mockResolvedValue(user);

    const res = await POST(makeRequest({ token, newPassword: "newpass123" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toMatch(/updated successfully/i);
    expect(user.password).toBe("newpass123");
    expect(user.tokenVersion).toBe(1);
    expect(user.save).toHaveBeenCalled();
  });

  it("returns 400 for an expired token", async () => {
    const token = signToken({ id: "user-1", purpose: "reset-password", v: 0 }, { expiresIn: -10 });

    const res = await POST(makeRequest({ token, newPassword: "newpass123" }));

    expect(res.status).toBe(400);
  });
});
