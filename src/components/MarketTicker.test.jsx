import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFetchResponse } from "@/test/fixtures";
import MarketTicker from "./MarketTicker";

function mockFetchOnce(response) {
  global.fetch.mockImplementation((url) => {
    if (url === "/api/market/indices") return Promise.resolve(response);
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("MarketTicker", () => {
  it("renders skeleton cards while loading", () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<MarketTicker />);
    expect(container.querySelectorAll('[class*="cardSkeleton"]').length).toBe(4);
  });

  it("renders nothing when data.configured is false", async () => {
    mockFetchOnce(makeFetchResponse({ configured: false }));
    const { container } = render(<MarketTicker />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an unavailable message on fetch error", async () => {
    mockFetchOnce(makeFetchResponse(null, { ok: false, status: 500 }));
    render(<MarketTicker />);
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it("shows an unavailable message when quotes list is empty", async () => {
    mockFetchOnce(makeFetchResponse({ configured: true, quotes: [] }));
    render(<MarketTicker />);
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it("renders quote cards with up/down styling", async () => {
    mockFetchOnce(
      makeFetchResponse({
        configured: true,
        quotes: [
          { symbol: "SPY", displayName: "S&P 500", price: 500.5, change: 2.1, changePercent: 0.42 },
          { symbol: "DIA", displayName: "Dow Jones", price: 400.25, change: -1.5, changePercent: -0.37 },
        ],
        lastUpdated: "2026-01-01T12:00:00.000Z",
      })
    );
    render(<MarketTicker />);

    expect(await screen.findByText("S&P 500")).toBeInTheDocument();
    expect(screen.getByText("+0.42%")).toBeInTheDocument();
    expect(screen.getByText("-0.37%")).toBeInTheDocument();
    expect(screen.getByText(/last updated at/i)).toBeInTheDocument();
  });
});
