import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

vi.mock("nanoid", () => ({ nanoid: () => "generated-slug-id" }));

const { PATCH } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/archives/1/visibility", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/archives/[archiveId]/visibility", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ isPublic: true }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await PATCH(makeRequest({ isPublic: true }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(403);
  });

  it("rejects a non-boolean isPublic", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await PATCH(makeRequest({ isPublic: "yes" }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the archive isn't the user's", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Archive.findOne.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ isPublic: true }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(404);
  });

  it("generates a publicSlug when making an archive public for the first time", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const archive = createInstanceMock({ id: 1, isPublic: false, publicSlug: null });
    // createInstanceMock's update() mutates its own closed-over data, not
    // the spread instance object returned to the caller — override it here
    // so the route's post-update reads of archive.isPublic/publicSlug (the
    // same pattern real Sequelize instances support) reflect the change.
    archive.update = vi.fn(async (patch) => {
      Object.assign(archive, patch);
      return archive;
    });
    db.Archive.findOne.mockResolvedValue(archive);

    const res = await PATCH(makeRequest({ isPublic: true }), {
      params: Promise.resolve({ archiveId: "1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(archive.update).toHaveBeenCalledWith({
      isPublic: true,
      publicSlug: "generated-slug-id",
    });
    expect(body.publicSlug).toBe("generated-slug-id");
  });

  it("does not regenerate an existing publicSlug", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const archive = createInstanceMock({ id: 1, isPublic: true, publicSlug: "existing-slug" });
    db.Archive.findOne.mockResolvedValue(archive);

    await PATCH(makeRequest({ isPublic: true }), { params: Promise.resolve({ archiveId: "1" }) });

    expect(archive.update).toHaveBeenCalledWith({ isPublic: true });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Archive.findOne.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ isPublic: true }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(500);
  });
});
