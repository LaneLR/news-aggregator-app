import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeArticle, makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => mockNotFound() }));

vi.mock("@/components/NewsGridWrapper", () => ({
  default: ({ children }) => <div data-testid="news-grid">{children}</div>,
}));
vi.mock("@/components/NewsCardThree", () => ({
  default: (props) => <div data-testid="news-card">{JSON.stringify(props)}</div>,
}));
vi.mock("@/components/ArchiveVisibilityToggle", () => ({
  default: (props) => <div data-testid="visibility-toggle">{JSON.stringify(props)}</div>,
}));

const { default: ArchiveDetailPage } = await import("./page");

function makeParams(id) {
  return { params: Promise.resolve({ id }) };
}

describe("ArchiveDetailPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
  });

  it("calls notFound when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(ArchiveDetailPage(makeParams("1"))).rejects.toThrow("NOT_FOUND");
    expect(db.Archive.findOne).not.toHaveBeenCalled();
  });

  it("awaits params and queries by the numeric archive id (regression: params is a Promise)", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const archive = createInstanceMock({ id: 42, name: "My archive", isPublic: false });
    archive.SavedArticles = [];
    db.Archive.findOne.mockResolvedValue(archive);

    await ArchiveDetailPage(makeParams("42"));

    expect(db.Archive.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42, userId: "user-1" } })
    );
  });

  it("calls notFound when the archive doesn't belong to the user (or doesn't exist)", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.Archive.findOne.mockResolvedValue(null);

    await expect(ArchiveDetailPage(makeParams("999"))).rejects.toThrow("NOT_FOUND");
  });

  it("renders an empty state when the archive has no saved articles", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const archive = createInstanceMock({ id: 1, name: "Empty archive" });
    archive.SavedArticles = [];
    db.Archive.findOne.mockResolvedValue(archive);

    const element = await ArchiveDetailPage(makeParams("1"));
    render(element);

    expect(screen.getByText("No articles have been added to this Archive.")).toBeInTheDocument();
    expect(screen.queryByTestId("news-grid")).not.toBeInTheDocument();
  });

  it("renders NewsCardThree for each saved article with archiveId and viewOnly=false", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Free" }));
    const article = makeArticle({ id: "a1" });
    const archive = createInstanceMock({ id: 7, name: "Saved" });
    archive.SavedArticles = [{ toJSON: () => article }];
    db.Archive.findOne.mockResolvedValue(archive);

    const element = await ArchiveDetailPage(makeParams("7"));
    render(element);

    const cardProps = JSON.parse(screen.getByTestId("news-card").textContent);
    expect(cardProps.archiveId).toBe(7);
    expect(cardProps.viewOnly).toBe(false);
    expect(cardProps.article.id).toBe("a1");
  });

  it("shows the visibility toggle only for subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));
    const archive = createInstanceMock({ id: 3, name: "Subscribed archive" });
    archive.SavedArticles = [];
    db.Archive.findOne.mockResolvedValue(archive);

    const element = await ArchiveDetailPage(makeParams("3"));
    render(element);

    expect(screen.getByTestId("visibility-toggle")).toBeInTheDocument();
  });
});
