import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";
import Watchlist from "./Watchlist";

function mockLoadResponse(body, opts) {
  global.fetch.mockResolvedValueOnce(makeFetchResponse(body, opts));
}

describe("Watchlist", () => {
  it("renders nothing when the market feature isn't configured", async () => {
    mockLoadResponse({ configured: false });
    const { container } = render(<Watchlist />);
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("shows the empty-state hint when there are no symbols yet", async () => {
    mockLoadResponse({ configured: true, symbols: [], quotes: [] });
    render(<Watchlist />);
    expect(await screen.findByText("Add a ticker above to track it alongside the major indices.")).toBeInTheDocument();
  });

  it("renders quote cards for tracked symbols", async () => {
    mockLoadResponse({
      configured: true,
      symbols: ["AAPL"],
      quotes: [{ symbol: "AAPL", price: 150.5, change: 2.1, changePercent: 1.42 }],
      lastUpdated: "2026-01-01T12:00:00.000Z",
    });
    render(<Watchlist />);

    expect(await screen.findByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("150.50")).toBeInTheDocument();
    expect(screen.getByText("+1.42%")).toBeInTheDocument();
  });

  it("rejects an invalid ticker symbol without calling the API", async () => {
    mockLoadResponse({ configured: true, symbols: [], quotes: [] });
    const user = userEvent.setup();
    render(<Watchlist />);
    await screen.findByPlaceholderText("Add a ticker (e.g. AAPL)…");

    await user.type(screen.getByPlaceholderText("Add a ticker (e.g. AAPL)…"), "!!!");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Not a valid ticker symbol.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1); // only the initial load
  });

  it("adds a valid symbol via PATCH and reloads the list", async () => {
    mockLoadResponse({ configured: true, symbols: [], quotes: [] });
    const user = userEvent.setup();
    render(<Watchlist />);
    await screen.findByPlaceholderText("Add a ticker (e.g. AAPL)…");

    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true })); // PATCH
    mockLoadResponse({
      configured: true,
      symbols: ["AAPL"],
      quotes: [{ symbol: "AAPL", price: 150.5, change: 2.1, changePercent: 1.42 }],
    }); // reload

    await user.type(screen.getByPlaceholderText("Add a ticker (e.g. AAPL)…"), "aapl");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/watchlist",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ symbols: ["AAPL"] }) })
    );
    expect(await screen.findByText("AAPL")).toBeInTheDocument();
  });

  it("removes a symbol when its remove button is clicked", async () => {
    mockLoadResponse({
      configured: true,
      symbols: ["AAPL"],
      quotes: [{ symbol: "AAPL", price: 150.5, change: 2.1, changePercent: 1.42 }],
    });
    const user = userEvent.setup();
    render(<Watchlist />);
    await screen.findByText("AAPL");

    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true })); // PATCH
    mockLoadResponse({ configured: true, symbols: [], quotes: [] }); // reload

    await user.click(screen.getByRole("button", { name: "Remove AAPL from watchlist" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/watchlist",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ symbols: [] }) })
    );
  });

  it("blocks adding a duplicate symbol", async () => {
    mockLoadResponse({
      configured: true,
      symbols: ["AAPL"],
      quotes: [{ symbol: "AAPL", price: 150.5, change: 2.1, changePercent: 1.42 }],
    });
    const user = userEvent.setup();
    render(<Watchlist />);
    await screen.findByText("AAPL");

    await user.type(screen.getByPlaceholderText("Add a ticker (e.g. AAPL)…"), "AAPL");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Already on your watchlist.")).toBeInTheDocument();
  });
});
