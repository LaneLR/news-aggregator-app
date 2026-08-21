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

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(screen.getByLabelText('Remove "apple" from recent searches'));

    expect(screen.queryByText("apple")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => expect(JSON.parse(localStorage.getItem(RECENT_KEY))).toEqual(["tesla"]));
  });

  it("keeps the search input focused after removing a recent search, instead of blurring it", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["apple"]));
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(screen.getByLabelText('Remove "apple" from recent searches'));

    expect(input).toHaveFocus();
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

  it("falls back to an empty recent-searches list when localStorage holds invalid JSON", async () => {
    localStorage.setItem(RECENT_KEY, "not valid json{{{");
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.queryByText("Recent searches")).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside the search bar", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["apple"]));
    const user = userEvent.setup();
    render(
      <div>
        <SearchBar />
        <button type="button">Outside</button>
      </div>
    );

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("apple")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByText("apple")).not.toBeInTheDocument();
  });

  it("closes the dropdown on Escape", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["apple"]));
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByText("apple")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("apple")).not.toBeInTheDocument();
  });

  it("clears suggestions when the suggestions fetch rejects", async () => {
    const user = userEvent.setup();
    global.fetch.mockRejectedValueOnce(new Error("network down"));

    render(<SearchBar />);
    await user.type(screen.getByRole("combobox"), "ai");

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // No suggestion rows or trailing "see all" row show up once it settles.
    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument());
  });

  it("navigates a fetched suggestion via ArrowUp wraparound and Enter", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        suggestions: [{ id: "a1", title: "AI Breakthrough", sourceName: "Example", category: ["Tech"] }],
      })
    );

    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    await user.type(input, "ai");
    await screen.findByText("AI Breakthrough");

    // With one suggestion + a trailing "see all" row (itemCount 2),
    // ArrowUp from the default (-1) wraps to index 0 (the suggestion);
    // a second ArrowUp moves to index 1 (the trailing "see all" row).
    await user.keyboard("{ArrowUp}{ArrowUp}{Enter}");

    expect(push).toHaveBeenCalledWith("/search?query=ai");
  });

  it("clicks a recent-search row directly to run that search", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["apple"]));
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("apple"));

    expect(push).toHaveBeenCalledWith("/search?query=apple");
  });

  it("clicks the trailing 'See all results' row to run the current search", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        suggestions: [{ id: "a1", title: "AI Breakthrough", sourceName: "Example", category: ["Tech"] }],
      })
    );

    render(<SearchBar />);
    await user.type(screen.getByRole("combobox"), "ai");
    await screen.findByText("AI Breakthrough");

    await user.click(screen.getByText(/See all results for "ai"/));

    expect(push).toHaveBeenCalledWith("/search?query=ai");
  });
});
