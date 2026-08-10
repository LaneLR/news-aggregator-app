import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFetchResponse } from "@/test/fixtures";
import SectorPerformance from "./SectorPerformance";

describe("SectorPerformance", () => {
  it("shows skeleton cards while loading", () => {
    global.fetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
    const { container } = render(<SectorPerformance />);
    expect(container.querySelectorAll("[class*='cardSkeleton']").length).toBe(11);
  });

  it("renders nothing when the market feature isn't configured", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ configured: false }));
    const { container } = render(<SectorPerformance />);
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("shows an unavailable message on fetch failure", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse(null, { ok: false, status: 500 }));
    render(<SectorPerformance />);
    expect(await screen.findByText("Sector data is temporarily unavailable.")).toBeInTheDocument();
  });

  it("renders quote cards with up/down indicators", async () => {
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        configured: true,
        quotes: [
          { symbol: "XLK", displayName: "Technology", price: 123.456, change: 1.2, changePercent: 0.98 },
          { symbol: "XLE", displayName: "Energy", price: 45.678, change: -0.5, changePercent: -1.1 },
        ],
      })
    );
    render(<SectorPerformance />);

    expect(await screen.findByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("123.46")).toBeInTheDocument();
    expect(screen.getByText("+0.98%")).toBeInTheDocument();
    expect(screen.getByText("Energy")).toBeInTheDocument();
    expect(screen.getByText("-1.10%")).toBeInTheDocument();
  });
});
