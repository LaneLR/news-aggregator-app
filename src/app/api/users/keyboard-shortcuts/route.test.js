import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET, PATCH } = await import("./route");

const VALID_SHORTCUTS = {
  next: "j",
  prev: "k",
  open: "o",
  save: "s",
  like: "l",
  search: "/",
  help: "?",
};

function makeGetRequest() {
  return new NextRequest("http://localhost/api/users/keyboard-shortcuts");
}

function makePatchRequest(body) {
  return new NextRequest("http://localhost/api/users/keyboard-shortcuts", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("GET /api/users/keyboard-shortcuts", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("falls back to the defaults when the user has none saved", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue({ keyboardShortcuts: null });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.keyboardShortcuts).toEqual(VALID_SHORTCUTS);
  });
});

describe("PATCH /api/users/keyboard-shortcuts", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ keyboardShortcuts: VALID_SHORTCUTS }));

    expect(res.status).toBe(401);
  });

  it("rejects a non-object payload", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(makePatchRequest({ keyboardShortcuts: null }));

    expect(res.status).toBe(400);
  });

  it("rejects a shortcut bound to more than one character", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(
      makePatchRequest({ keyboardShortcuts: { ...VALID_SHORTCUTS, next: "jj" } })
    );

    expect(res.status).toBe(400);
  });

  it("rejects two actions sharing the same key", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(
      makePatchRequest({ keyboardShortcuts: { ...VALID_SHORTCUTS, prev: "j" } })
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ keyboardShortcuts: VALID_SHORTCUTS }));

    expect(res.status).toBe(404);
  });

  it("saves valid, fully-specified shortcuts", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);

    const res = await PATCH(makePatchRequest({ keyboardShortcuts: VALID_SHORTCUTS }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.keyboardShortcuts).toEqual(VALID_SHORTCUTS);
    expect(user.update).toHaveBeenCalledWith({ keyboardShortcuts: VALID_SHORTCUTS });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makePatchRequest({ keyboardShortcuts: VALID_SHORTCUTS }));

    expect(res.status).toBe(500);
  });
});
