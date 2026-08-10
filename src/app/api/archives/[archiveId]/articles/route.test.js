import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET, POST } = await import("./route");

function makeGetRequest() {
  return new NextRequest("http://localhost/api/archives/1/articles");
}
function makePostRequest(body) {
  return new NextRequest("http://localhost/api/archives/1/articles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/archives/[archiveId]/articles", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
    db.SavedArticle.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeGetRequest(), { params: Promise.resolve({ archiveId: "1" }) });

    expect(res.status).toBe(401);
  });

  it("rejects invalid archiveId", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await GET(makeGetRequest(), { params: Promise.resolve({ archiveId: "nope" }) });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the archive isn't the user's", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(null);

    const res = await GET(makeGetRequest(), { params: Promise.resolve({ archiveId: "1" }) });

    expect(res.status).toBe(404);
  });

  it("resolves the params promise and returns the saved articles", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 1 }));
    db.SavedArticle.findAll.mockResolvedValue([createInstanceMock({ id: 9, title: "A" })]);

    const res = await GET(makeGetRequest(), { params: Promise.resolve({ archiveId: "1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ id: 9, title: "A" }]);
    expect(db.SavedArticle.findAll).toHaveBeenCalledWith({
      where: { archiveId: 1 },
      order: [["createdAt", "DESC"]],
    });
  });
});

describe("POST /api/archives/[archiveId]/articles", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
    db.SavedArticle.findOne.mockReset();
    db.SavedArticle.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makePostRequest({ url: "x", title: "y" }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(401);
  });

  it("rejects invalid archiveId", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makePostRequest({ url: "x", title: "y" }), {
      params: Promise.resolve({ archiveId: "nope" }),
    });

    expect(res.status).toBe(400);
  });

  it("rejects a missing url or title", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makePostRequest({ url: "x" }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the archive isn't the user's", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(null);

    const res = await POST(makePostRequest({ url: "x", title: "y" }), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 200 and saved:true when already saved", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 1 }));
    db.SavedArticle.findOne.mockResolvedValue(createInstanceMock({ id: 5 }));

    const res = await POST(makePostRequest({ url: "x", title: "y" }), {
      params: Promise.resolve({ archiveId: "1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.saved).toBe(true);
  });

  it("creates and returns the new saved article, correctly awaiting params", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 1 }));
    db.SavedArticle.findOne.mockResolvedValue(null);
    db.SavedArticle.create.mockResolvedValue(createInstanceMock({ id: 7, title: "y", url: "x" }));

    const res = await POST(makePostRequest({ url: "x", title: "y" }), {
      params: Promise.resolve({ archiveId: "1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.article.id).toBe(7);
    expect(db.SavedArticle.create).toHaveBeenCalledWith(
      expect.objectContaining({ archiveId: 1, url: "x", title: "y" })
    );
  });
});
