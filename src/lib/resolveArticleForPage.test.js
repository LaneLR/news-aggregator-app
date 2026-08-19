import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSession } from "@/test/fixtures";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetArticleReaderData = vi.fn();
vi.mock("@/lib/articleReaderData", () => ({
  getArticleReaderData: (...args) => mockGetArticleReaderData(...args),
}));

const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  redirect: (url) => mockRedirect(url),
}));

const { resolveArticleForPage } = await import("./resolveArticleForPage");

describe("resolveArticleForPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetArticleReaderData.mockReset();
  });

  it("calls notFound when the article doesn't exist", async () => {
    mockAuth.mockResolvedValue(null);
    mockGetArticleReaderData.mockResolvedValue(null);

    await expect(resolveArticleForPage("999")).rejects.toThrow("NOT_FOUND");
  });

  it("redirects to /pricing when the article is gated and the user can't read it", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    mockGetArticleReaderData.mockResolvedValue({ gated: true });

    await expect(resolveArticleForPage("1")).rejects.toThrow("REDIRECT:/pricing");
  });

  it("returns the reader data as-is when the article is readable", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    const data = { gated: false, article: { id: "1", title: "Big story" } };
    mockGetArticleReaderData.mockResolvedValue(data);

    await expect(resolveArticleForPage("1")).resolves.toBe(data);
  });

  it("passes the resolved session through to getArticleReaderData", async () => {
    const session = makeSession({ tier: "Free" });
    mockAuth.mockResolvedValue(session);
    mockGetArticleReaderData.mockResolvedValue({ gated: false, article: {} });

    await resolveArticleForPage("42");

    expect(mockGetArticleReaderData).toHaveBeenCalledWith("42", session);
  });
});
