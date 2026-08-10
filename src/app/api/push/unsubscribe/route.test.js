import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/push/unsubscribe", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/push/unsubscribe", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.PushSubscription.destroy.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ endpoint: "https://push.example.com/x" }));

    expect(res.status).toBe(401);
  });

  it("rejects a missing endpoint", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("destroys the subscription scoped to the signed-in user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));

    const res = await POST(makeRequest({ endpoint: "https://push.example.com/x" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.PushSubscription.destroy).toHaveBeenCalledWith({
      where: { endpoint: "https://push.example.com/x", userId: "user-1" },
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.PushSubscription.destroy.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ endpoint: "https://push.example.com/x" }));

    expect(res.status).toBe(500);
  });
});
