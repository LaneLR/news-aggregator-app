import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/Loading", () => ({
  default: (props) => <div data-testid="loading-dots" data-props={JSON.stringify(props)} />,
}));

const { default: Loading } = await import("./loading");

describe("app/loading (route-level Suspense fallback)", () => {
  it("renders the LoadingDots indicator with its configured animation props", () => {
    const { getByTestId } = render(<Loading />);

    const el = getByTestId("loading-dots");
    const props = JSON.parse(el.dataset.props);
    expect(props).toMatchObject({
      size: 14,
      color: "var(--theme-primary)",
      duration: 1.0,
      gap: 10,
      stagger: 0.14,
    });
  });
});
