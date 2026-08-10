import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarouselRow from "./CarouselRow";

describe("CarouselRow", () => {
  it("renders children inside the scroll row", () => {
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
    expect(screen.getByText("Card A")).toBeInTheDocument();
  });

  it("scrolls right/left when the arrow buttons are clicked", async () => {
    const user = userEvent.setup();
    render(
      <CarouselRow>
        <div>Card A</div>
      </CarouselRow>
    );
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
});
