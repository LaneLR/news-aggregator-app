import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetUnreadCounts = vi.fn();
vi.mock("@/lib/unreadCounts", () => ({
  getUnreadCounts: (...args) => mockGetUnreadCounts(...args),
}));

const { GET } = await import("./route");

const EMPTY = { categories: {}, feeds: 0, following: 0 };

describe("GET /api/users/unread-counts", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
    mockGetUnreadCounts.mockReset();
  });

  it("returns the empty shape for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(EMPTY);
    expect(mockGetUnreadCounts).not.toHaveBeenCalled();
  });

  it("returns the empty shape when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual(EMPTY);
  });

  it("returns computed unread counts for a signed-in user", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.User.findByPk.mockResolvedValue({ id: "user-1", mutedKeywords: [], followedKeywords: [] });
    mockGetUnreadCounts.mockResolvedValue({ categories: { business: 3 }, feeds: 2, following: 1 });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ categories: { business: 3 }, feeds: 2, following: 1 });
    expect(mockGetUnreadCounts).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ id: "user-1" }),
      { isSubscribed: true }
    );
  });

  it("returns the empty shape (with 500) on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual(EMPTY);
  });
});
