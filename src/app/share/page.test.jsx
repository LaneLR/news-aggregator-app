import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { default: SharePage, metadata } = await import("./page");

function makeSearchParams(params) {
  return { searchParams: Promise.resolve(params) };
}

describe("SharePage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
    db.SavedArticle.findOne.mockReset();
    db.SavedArticle.create.mockReset();
  });

  it("prompts anonymous visitors to sign in, with a callback URL back to /share", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await SharePage(
      makeSearchParams({ url: "https://example.com/story", title: "A story" })
    );
    render(element);

    expect(screen.getByText("Sign in to save this article")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Sign In" });
    expect(link.getAttribute("href")).toContain("/login?callbackUrl=");
    expect(link.getAttribute("href")).toContain(encodeURIComponent("/share?"));
  });

  it("shows 'Nothing to save' when there's no url and text has no URL-shaped token", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const element = await SharePage(makeSearchParams({ text: "just some words" }));
    render(element);

    expect(screen.getByText("Nothing to save")).toBeInTheDocument();
    expect(db.Archive.findOne).not.toHaveBeenCalled();
  });

  it("extracts a URL out of the text field when url isn't provided", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.Archive.findOne.mockResolvedValue(null);

    const element = await SharePage(
      makeSearchParams({ text: "Check this out: https://example.com/cool-article and more text" })
    );
    render(element);

    expect(screen.getByText("Saved to your Archives")).toBeInTheDocument();
  });

  it("creates a SavedArticle in the default archive when it doesn't already exist", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const archive = createInstanceMock({ id: 5 });
    db.Archive.findOne.mockResolvedValue(archive);
    db.SavedArticle.findOne.mockResolvedValue(null);

    const element = await SharePage(
      makeSearchParams({ url: "https://example.com/story", title: "A story" })
    );
    render(element);

    expect(db.Archive.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", name: "Saved for later" } })
    );
    expect(db.SavedArticle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "A story",
        url: "https://example.com/story",
        archiveId: 5,
      })
    );
    expect(screen.getByText("Saved to your Archives")).toBeInTheDocument();
    expect(screen.getByText("A story")).toBeInTheDocument();
  });

  it("does not duplicate a SavedArticle that's already in the archive", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const archive = createInstanceMock({ id: 5 });
    db.Archive.findOne.mockResolvedValue(archive);
    db.SavedArticle.findOne.mockResolvedValue({ id: "existing" });

    await SharePage(makeSearchParams({ url: "https://example.com/story" }));

    expect(db.SavedArticle.create).not.toHaveBeenCalled();
  });

  it("still shows success when the user has no default archive yet", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.Archive.findOne.mockResolvedValue(null);

    const element = await SharePage(makeSearchParams({ url: "https://example.com/story" }));
    render(element);

    expect(db.SavedArticle.create).not.toHaveBeenCalled();
    expect(screen.getByText("Saved to your Archives")).toBeInTheDocument();
  });

  it("falls back to the URL as the title when no title is provided", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.Archive.findOne.mockResolvedValue(null);

    const element = await SharePage(makeSearchParams({ url: "https://example.com/story" }));
    render(element);

    expect(screen.getByText("https://example.com/story")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
