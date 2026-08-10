import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
// createModelMock doesn't stub `increment` (not part of the shared model
// mock's static-method set) — add it locally since this route is the only
// one under test here that calls it.
db.Article.increment = vi.fn().mockResolvedValue([1]);
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/articles/click", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/articles/click", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Article.increment.mockReset();
    db.UserInteraction.create.mockReset();
    db.ReadArticle.findOrCreate.mockReset();
  });

  it("rejects a missing articleUrl", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("records the click anonymously without a session", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ articleUrl: "https://x.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.Article.increment).toHaveBeenCalledWith("clickCount", {
      where: { url: "https://x.com" },
    });
    expect(db.UserInteraction.create).not.toHaveBeenCalled();
  });

  it("logs a UserInteraction and marks the article read for a logged-in user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));

    const res = await POST(
      makeRequest({ articleUrl: "https://x.com", sourceName: "CNN", category: ["Business"] })
    );

    expect(res.status).toBe(200);
    expect(db.UserInteraction.create).toHaveBeenCalledWith({
      userId: expect.any(String),
      articleUrl: "https://x.com",
      sourceName: "CNN",
      category: ["Business"],
    });
    expect(db.ReadArticle.findOrCreate).toHaveBeenCalled();
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.increment.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ articleUrl: "https://x.com" }));

    expect(res.status).toBe(500);
  });
});
