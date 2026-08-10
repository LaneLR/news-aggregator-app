import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { default: SearchBar } = await import("./SearchBar");

const RECENT_KEY = "morningfeeds:recentSearches";

describe("SearchBar", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders a search input", () => {
    render(<SearchBar />);
    expect(screen.getByRole("combobox", { name: "Search articles" })).toBeInTheDocument();
  });

  it("shows recent searches from localStorage when the input is focused", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["apple", "tesla"]));
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("apple")).toBeInTheDocument();
    expect(screen.getByText("tesla")).toBeInTheDocument();
  });

  it("navigates to the search page and saves the query as a recent search on Enter", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("combobox"), "nvidia{Enter}");

    expect(push).toHaveBeenCalledWith("/search?query=nvidia");
    expect(JSON.parse(localStorage.getItem(RECENT_KEY))).toEqual(["nvidia"]);
  });

  it("fetches and shows suggestions once the query is 2+ characters, debounced", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        suggestions: [{ id: "a1", title: "AI Breakthrough", sourceName: "Example", category: ["Tech"] }],
      })
    );

    render(<SearchBar />);
    await user.type(screen.getByRole("combobox"), "ai");

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/search/suggestions?query=ai"));
    expect(await screen.findByText("AI Breakthrough")).toBeInTheDocument();
  });

  it("does not fetch suggestions for a 1-character query", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("combobox"), "a");
    // Give the 250ms debounce window a chance to fire, if it were going to.
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("opens an article directly when a suggestion is clicked", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        suggestions: [{ id: "a1", title: "AI Breakthrough", sourceName: "Example", category: ["Tech"] }],
      })
    );

    render(<SearchBar />);
    await user.type(screen.getByRole("combobox"), "ai");

    await user.click(await screen.findByText("AI Breakthrough"));

    expect(push).toHaveBeenCalledWith("/article/a1");
  });

  it("removes a recent search entry via its remove control without triggering a search", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["apple", "tesla"]));
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByLabelText('Remove "apple" from recent searches'));

    expect(screen.queryByText("apple")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => expect(JSON.parse(localStorage.getItem(RECENT_KEY))).toEqual(["tesla"]));
  });

  it("supports arrow-key navigation through recent searches and Enter to select", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["apple", "tesla"]));
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(push).toHaveBeenCalledWith("/search?query=tesla");
  });
});
