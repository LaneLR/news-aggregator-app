import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/SearchFeed", () => ({
  default: (props) => <div data-testid="search-feed">{JSON.stringify(props)}</div>,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  redirect: (url) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

const { default: SearchResultsPage, metadata } = await import("./page");

function makeSearchParams(query) {
  return { searchParams: Promise.resolve(query) };
}

describe("SearchResultsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(SearchResultsPage(makeSearchParams({ query: "news" }))).rejects.toThrow(
      "REDIRECT:/login"
    );
  });

  it("calls notFound when the query is empty", async () => {
    mockAuth.mockResolvedValue(makeSession());

    await expect(SearchResultsPage(makeSearchParams({ query: "   " }))).rejects.toThrow(
      "NOT_FOUND"
    );
  });

  it("calls notFound when there is no query param at all", async () => {
    mockAuth.mockResolvedValue(makeSession());

    await expect(SearchResultsPage(makeSearchParams({}))).rejects.toThrow("NOT_FOUND");
  });

  it("renders SearchFeed with the lowercased query", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const element = await SearchResultsPage(makeSearchParams({ query: "Climate CHANGE" }));
    render(element);

    const props = JSON.parse(screen.getByTestId("search-feed").textContent);
    expect(props.initialQuery).toBe("climate change");
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
