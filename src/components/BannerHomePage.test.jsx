import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Banner3 from "./BannerHomePage";

describe("BannerHomePage", () => {
  it("renders title, features, cost, promo code, and children", () => {
    render(
      <Banner3
        title="Pro Plan"
        features={["Feature A", "Feature B"]}
        cost="$5/mo"
        promoCode="SAVE10"
      >
        <button type="button">Subscribe</button>
      </Banner3>
    );

    expect(screen.getByText("Pro Plan")).toBeInTheDocument();
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature B")).toBeInTheDocument();
    expect(screen.getByText("$5/mo")).toBeInTheDocument();
    expect(screen.getByText("SAVE10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
  });
});
