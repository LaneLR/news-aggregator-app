import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";
import MarketChart from "./MarketChart";

function mockHistory(handler) {
  global.fetch.mockImplementation((url) => {
    if (url.toString().startsWith("/api/market/history")) return Promise.resolve(handler(url));
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("MarketChart", () => {
  it("renders a loading skeleton before data arrives", () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<MarketChart />);
    expect(container.querySelector('[class*="chartSkeleton"]')).toBeInTheDocument();
  });

  it("shows an unavailable message when the request fails", async () => {
    mockHistory(() => makeFetchResponse(null, { ok: false, status: 500 }));
    render(<MarketChart />);
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it("shows a 'not enough data' message when fewer than 2 points come back", async () => {
    mockHistory(() => makeFetchResponse({ points: [{ t: "2026-01-01T00:00:00.000Z", price: 100 }] }));
    render(<MarketChart />);
    expect(await screen.findByText(/no chart data available/i)).toBeInTheDocument();
  });

  it("renders the price, change badge, and svg chart once data loads", async () => {
    mockHistory(() =>
      makeFetchResponse({
        points: [
          { t: "2026-01-01T00:00:00.000Z", price: 100 },
          { t: "2026-01-02T00:00:00.000Z", price: 110 },
        ],
      })
    );
    render(<MarketChart />);

    expect(await screen.findByRole("img", { name: /S&P 500 price trend/i })).toBeInTheDocument();
    expect(screen.getByText("110.00")).toBeInTheDocument();
    expect(screen.getByText("10.00%")).toBeInTheDocument();
  });

  it("switches symbols when a different index tab is clicked, re-fetching data", async () => {
    const user = userEvent.setup();
    mockHistory((url) =>
      makeFetchResponse({
        points: [
          { t: "2026-01-01T00:00:00.000Z", price: 100 },
          { t: "2026-01-02T00:00:00.000Z", price: 105 },
        ],
      })
    );
    render(<MarketChart />);
    await screen.findByRole("img", { name: /S&P 500 price trend/i });

    await user.click(screen.getByRole("button", { name: "Dow Jones" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("symbol=DIA"))
    );
    expect(await screen.findByRole("img", { name: /Dow Jones price trend/i })).toBeInTheDocument();
  });

  it("switches ranges when a different range tab is clicked", async () => {
    const user = userEvent.setup();
    mockHistory(() =>
      makeFetchResponse({
        points: [
          { t: "2026-01-01T00:00:00.000Z", price: 100 },
          { t: "2026-01-02T00:00:00.000Z", price: 105 },
        ],
      })
    );
    render(<MarketChart />);
    await screen.findByRole("img", { name: /S&P 500 price trend/i });

    await user.click(screen.getByRole("button", { name: "1Y" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("range=1y"))
    );
  });
});
