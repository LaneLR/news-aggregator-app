import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import Default from "./default";

describe("@modal default", () => {
  it("renders nothing — the fallback for an unmatched/inactive modal slot", () => {
    const { container } = render(<Default />);
    expect(container).toBeEmptyDOMElement();
  });
});
