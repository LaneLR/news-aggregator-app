import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeArticle } from "@/test/fixtures";

const { default: PremiumTeaserCard } = await import("./PremiumTeaserCard");

describe("PremiumTeaserCard", () => {
  it("links to /pricing, not the article itself", () => {
    const article = makeArticle({ title: "Fed Cuts Rates", sourceName: "Bloomberg" });
    render(<PremiumTeaserCard article={article} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/pricing");
  });

  it("shows the real source name and headline (accessibly), even though the headline is visually blurred", () => {
    const article = makeArticle({ title: "Fed Cuts Rates", sourceName: "Bloomberg" });
    render(<PremiumTeaserCard article={article} />);

    expect(screen.getByText("Bloomberg")).toBeInTheDocument();
    expect(screen.getByText("Fed Cuts Rates")).toBeInTheDocument();
    expect(screen.getByText("MochaReads Pro")).toBeInTheDocument();
  });

  it("includes the headline in the link's accessible name", () => {
    const article = makeArticle({ title: "Fed Cuts Rates", sourceName: "Bloomberg" });
    render(<PremiumTeaserCard article={article} />);

    expect(screen.getByRole("link", { name: /Fed Cuts Rates/ })).toBeInTheDocument();
  });

  it("renders a proxied image when the article has one", () => {
    const article = makeArticle({ urlToImage: "https://example.com/photo.jpg" });
    render(<PremiumTeaserCard article={article} />);

    const img = screen.getByRole("link").querySelector("img");
    expect(img).toHaveAttribute(
      "src",
      "/api/image-proxy?url=" + encodeURIComponent("https://example.com/photo.jpg")
    );
  });

  it("falls back to the category placeholder art when there is no image", () => {
    const article = makeArticle({ urlToImage: null, category: ["Business"] });
    render(<PremiumTeaserCard article={article} />);

    expect(screen.getByRole("link").querySelector("img")).not.toBeInTheDocument();
  });

  it("falls back to a generic label when the source name is missing", () => {
    const article = makeArticle({ sourceName: null });
    render(<PremiumTeaserCard article={article} />);

    expect(screen.getAllByText("MochaReads Pro").length).toBeGreaterThan(0);
  });

  it("applies the list-density layout class when density is 'list'", () => {
    const article = makeArticle();
    render(<PremiumTeaserCard article={article} density="list" />);

    expect(screen.getByRole("link").className).toMatch(/densityList/);
  });

  it("applies the magazine-density layout class when density is 'magazine'", () => {
    const article = makeArticle();
    render(<PremiumTeaserCard article={article} density="magazine" />);

    expect(screen.getByRole("link").className).toMatch(/densityMagazine/);
  });

  it("renders without a category accent color when category isn't an array", () => {
    const article = makeArticle({ category: null });
    render(<PremiumTeaserCard article={article} />);

    expect(screen.getByRole("link")).not.toHaveStyle({ borderTopWidth: "4px" });
  });
});
