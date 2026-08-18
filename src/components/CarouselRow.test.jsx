import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarouselRow from "./CarouselRow";

// jsdom doesn't compute real layout, so scrollWidth/clientWidth/scrollLeft
// are all 0 by default — these are defined with getters so the component's
// own scroll/resize-driven re-reads (it reads the live DOM properties, not
// a snapshot) pick up whatever this test set them to.
function setScrollMetrics(el, { scrollLeft = 0, clientWidth = 300, scrollWidth = 300 }) {
  Object.defineProperty(el, "clientWidth", { configurable: true, value: clientWidth });
  Object.defineProperty(el, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(el, "scrollLeft", { configurable: true, writable: true, value: scrollLeft });
}

describe("CarouselRow", () => {
  it("renders children inside the scroll row", () => {
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    expect(screen.getByText("Card A")).toBeInTheDocument();
  });

  it("renders no arrows when the row has no overflow", () => {
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    // Default jsdom metrics (clientWidth === scrollWidth === 0) already
    // mean "no overflow" — nothing further to set up.
    expect(screen.queryByRole("button", { name: "Scroll left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scroll right" })).not.toBeInTheDocument();
  });

  it("shows only the right arrow when overflow exists but scrolled to the start", () => {
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    const row = screen.getByTestId("carousel-scroll-row");
    setScrollMetrics(row, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(row);

    expect(screen.queryByRole("button", { name: "Scroll left" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scroll right" })).toBeInTheDocument();
  });

  it("shows only the left arrow once scrolled all the way to the end", () => {
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    const row = screen.getByTestId("carousel-scroll-row");
    setScrollMetrics(row, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(row);

    expect(screen.getByRole("button", { name: "Scroll left" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scroll right" })).not.toBeInTheDocument();
  });

  it("shows both arrows when scrolled somewhere in the middle", () => {
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    const row = screen.getByTestId("carousel-scroll-row");
    setScrollMetrics(row, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(row);

    expect(screen.getByRole("button", { name: "Scroll left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scroll right" })).toBeInTheDocument();
  });

  it("scrolls right/left when the arrow buttons are clicked", async () => {
    const user = userEvent.setup();
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    const row = screen.getByTestId("carousel-scroll-row");
    setScrollMetrics(row, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(row);

    // jsdom doesn't implement scrollBy — stub it so clicking doesn't throw,
    // and so we can assert direction.
    const scrollByMock = vi.fn();
    Element.prototype.scrollBy = scrollByMock;

    await user.click(screen.getByRole("button", { name: "Scroll right" }));
    expect(scrollByMock).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number) }));
    expect(scrollByMock.mock.calls[0][0].left).toBeGreaterThanOrEqual(0);

    await user.click(screen.getByRole("button", { name: "Scroll left" }));
    expect(scrollByMock.mock.calls[1][0].left).toBeLessThanOrEqual(0);
  });

  it("re-measures when the children change (e.g. more cards load in)", () => {
    const row = { current: null };
    const { rerender } = render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    row.current = screen.getByTestId("carousel-scroll-row");
    setScrollMetrics(row.current, { scrollLeft: 0, clientWidth: 300, scrollWidth: 300 });
    expect(screen.queryByRole("button", { name: "Scroll right" })).not.toBeInTheDocument();

    setScrollMetrics(row.current, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    rerender(
      <CarouselRow>
        <div>Card A</div>
        <div>Card B</div>
      </CarouselRow>
    );

    expect(screen.getByRole("button", { name: "Scroll right" })).toBeInTheDocument();
  });

  it("ignores a ResizeObserver callback that fires after unmount", () => {
    // A resize/scroll notification can already be queued when the
    // component unmounts (e.g. a client-side route change navigating away
    // mid-carousel) — React nulls the ref before cleanup fully detaches
    // these listeners, so the callback can still fire once against a null
    // ref. The real ResizeObserver.observe() is a no-op in jsdom (see
    // vitest.setup.js), so capture the callback directly to simulate that.
    let capturedCallback;
    const OriginalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback) {
        capturedCallback = callback;
      }
      observe() {}
      disconnect() {}
    };

    const { unmount } = render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    unmount();

    expect(() => capturedCallback()).not.toThrow();

    globalThis.ResizeObserver = OriginalResizeObserver;
  });
});
