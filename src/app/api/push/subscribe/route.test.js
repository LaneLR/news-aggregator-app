import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
// createModelMock() doesn't stub `upsert` by default (not every model uses
// it) — add it here since this route relies on PushSubscription.upsert.
db.PushSubscription.upsert = vi.fn();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/push/subscribe", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.PushSubscription.upsert.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ endpoint: "https://push.example.com/x", keys: { p256dh: "a", auth: "b" } }));

    expect(res.status).toBe(401);
  });

  it("rejects a subscription missing keys", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makeRequest({ endpoint: "https://push.example.com/x", keys: {} }));

    expect(res.status).toBe(400);
  });

  it("rejects a missing endpoint", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makeRequest({ keys: { p256dh: "a", auth: "b" } }));

    expect(res.status).toBe(400);
  });

  it("upserts the subscription for the signed-in user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));

    const res = await POST(
      makeRequest({ endpoint: "https://push.example.com/x", keys: { p256dh: "a", auth: "b" } })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.PushSubscription.upsert).toHaveBeenCalledWith({
      endpoint: "https://push.example.com/x",
      userId: "user-1",
      p256dh: "a",
      auth: "b",
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.PushSubscription.upsert.mockRejectedValue(new Error("db down"));

    const res = await POST(
      makeRequest({ endpoint: "https://push.example.com/x", keys: { p256dh: "a", auth: "b" } })
    );

    expect(res.status).toBe(500);
  });
});
