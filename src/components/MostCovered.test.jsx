import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFetchResponse } from "@/test/fixtures";
import MostCovered from "./MostCovered";

function mockFetchOnce(response) {
  global.fetch.mockImplementation((url) => {
    if (url === "/api/market/most-covered") return Promise.resolve(response);
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("MostCovered", () => {
  it("renders skeleton rows while loading", () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // never resolves
    const { container } = render(<MostCovered />);
    expect(container.querySelectorAll('[class*="rowSkeleton"]').length).toBe(5);
  });

  it("renders nothing when the request fails", async () => {
    mockFetchOnce(makeFetchResponse(null, { ok: false, status: 500 }));
    const { container } = render(<MostCovered />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the company list is empty", async () => {
    mockFetchOnce(makeFetchResponse({ companies: [] }));
    const { container } = render(<MostCovered />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders companies with a link when an articleId is present", async () => {
    mockFetchOnce(
      makeFetchResponse({
        companies: [
          { ticker: "AAPL", name: "Apple", count: 10, articleId: "article-1" },
          { ticker: "TSLA", name: "Tesla", count: 5, articleId: null },
        ],
      })
    );
    render(<MostCovered />);

    expect(await screen.findByText("Apple")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Apple.*AAPL.*10 mentions/s })).toHaveAttribute(
      "href",
      "/article/article-1"
    );
    expect(screen.getByText("Tesla")).toBeInTheDocument();
    expect(screen.getByText("5 mentions")).toBeInTheDocument();
  });
});
