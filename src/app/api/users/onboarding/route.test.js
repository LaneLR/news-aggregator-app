import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { PATCH } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/users/onboarding", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/onboarding", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ preferredCategories: ["Business"] }));

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ preferredCategories: ["Business"] }));

    expect(res.status).toBe(404);
  });

  it("strips gated categories for Free-tier users and marks onboarding complete", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(
      makeRequest({ preferredCategories: ["Business", "Market"], preferredSources: ["Reuters"] })
    );

    expect(res.status).toBe(200);
    expect(user.update).toHaveBeenCalledWith({
      preferredCategories: ["Business"],
      preferredSources: ["Reuters"],
      onboardingCompleted: true,
    });
  });

  it("keeps gated categories for Subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    await PATCH(makeRequest({ preferredCategories: ["Market"], preferredSources: [] }));

    expect(user.update).toHaveBeenCalledWith({
      preferredCategories: ["Market"],
      preferredSources: [],
      onboardingCompleted: true,
    });
  });

  it("defaults non-array preferences to empty arrays", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    await PATCH(makeRequest({}));

    expect(user.update).toHaveBeenCalledWith({
      preferredCategories: [],
      preferredSources: [],
      onboardingCompleted: true,
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ preferredCategories: [] }));

    expect(res.status).toBe(500);
  });
});
