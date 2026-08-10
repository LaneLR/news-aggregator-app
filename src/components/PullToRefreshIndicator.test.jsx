import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import PullToRefreshIndicator from "./PullToRefreshIndicator";

describe("PullToRefreshIndicator", () => {
  it("renders nothing when pullDistance is 0 and not refreshing", () => {
    const { container } = render(<PullToRefreshIndicator pullDistance={0} isRefreshing={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a wrapper sized to pullDistance while pulling", () => {
    const { container } = render(<PullToRefreshIndicator pullDistance={35} isRefreshing={false} />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ height: "35px" });
    // progress = 35/70 = 0.5
    expect(wrapper).toHaveStyle({ opacity: "0.5" });
  });

  it("caps progress at 1 once pullDistance exceeds the threshold", () => {
    const { container } = render(<PullToRefreshIndicator pullDistance={200} isRefreshing={false} />);
    expect(container.firstChild).toHaveStyle({ opacity: "1" });
  });

  it("renders at fixed threshold height and stays visible while refreshing, even at pullDistance 0", () => {
    const { container } = render(<PullToRefreshIndicator pullDistance={0} isRefreshing={true} />);
    expect(container).not.toBeEmptyDOMElement();
    expect(container.firstChild).toHaveStyle({ height: "70px" });
  });
});
