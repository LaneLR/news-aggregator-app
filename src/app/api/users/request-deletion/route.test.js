import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockSendEmail = vi.fn();
vi.mock("@/utils/emailer", () => ({ sendEmail: (...args) => mockSendEmail(...args) }));

const { PATCH } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/users/request-deletion", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/request-deletion", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockSendEmail.mockReset().mockResolvedValue(undefined);
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ userId: "user-1" }));

    expect(res.status).toBe(401);
  });

  it("rejects a userId that doesn't match the session user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));

    const res = await PATCH(makeRequest({ userId: "someone-else" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ userId: "user-1" }));

    expect(res.status).toBe(404);
  });

  it("marks the account pending deletion and sends a confirmation email", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makeRequest({ userId: "user-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain("scheduled for deletion");
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ isPendingDeletion: true, deletionRequestedAt: expect.any(Date) })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@example.com", subject: expect.stringContaining("Deletion Request") })
    );
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ userId: "user-1" }));

    expect(res.status).toBe(500);
  });
});
