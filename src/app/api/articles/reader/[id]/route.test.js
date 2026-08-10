import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSession } from "@/test/fixtures";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetArticleReaderData = vi.fn();
vi.mock("@/lib/articleReaderData", () => ({
  getArticleReaderData: (...args) => mockGetArticleReaderData(...args),
}));

const { GET } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/articles/reader/1");
}

describe("GET /api/articles/reader/[id]", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetArticleReaderData.mockReset();
  });

  it("returns 404 when the article doesn't exist", async () => {
    mockAuth.mockResolvedValue(null);
    mockGetArticleReaderData.mockResolvedValue(null);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(404);
  });

  it("returns 403 for gated content", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    mockGetArticleReaderData.mockResolvedValue({ gated: true });

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(403);
  });

  it("returns the article data on success, correctly awaiting params", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetArticleReaderData.mockResolvedValue({ gated: false, article: { id: "1" } });

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: "1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.article.id).toBe("1");
    expect(mockGetArticleReaderData).toHaveBeenCalledWith("1", expect.anything());
  });
});
