import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockDeleteExpiredUsers = vi.fn();
vi.mock("@/utils/deleteExpiredUsers.mjs", () => ({
  deleteExpiredUsers: (...args) => mockDeleteExpiredUsers(...args),
}));

const { GET, POST } = await import("./route");

function makeRequest(authHeader) {
  return new NextRequest("http://localhost/api/cron/delete-users", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET,POST /api/cron/delete-users", () => {
  beforeEach(() => {
    mockDeleteExpiredUsers.mockReset();
  });

  it("rejects requests missing the CRON_SECRET bearer header", async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    expect(mockDeleteExpiredUsers).not.toHaveBeenCalled();
  });

  it("rejects requests with the wrong secret", async () => {
    const res = await GET(makeRequest("Bearer wrong-secret"));

    expect(res.status).toBe(401);
  });

  it("runs the deletion job when the secret matches, for both GET and POST", async () => {
    mockDeleteExpiredUsers.mockResolvedValue(undefined);

    const getRes = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const postRes = await POST(makeRequest(`Bearer ${process.env.CRON_SECRET}`));

    expect(getRes.status).toBe(200);
    expect(postRes.status).toBe(200);
    expect(mockDeleteExpiredUsers).toHaveBeenCalledTimes(2);
  });

  it("returns 500 when the deletion job throws", async () => {
    mockDeleteExpiredUsers.mockRejectedValue(new Error("stripe down"));

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));

    expect(res.status).toBe(500);
  });
});
