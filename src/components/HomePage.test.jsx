import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./HomePage";

describe("HomePage", () => {
  it("renders the hero heading and sign-up/log-in CTAs", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /all the news\. one place\./i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /sign up free/i })[0]).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("renders the free category links", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /business/i })).toHaveAttribute("href", "/category/business");
    expect(screen.getByRole("link", { name: /weather/i })).toHaveAttribute("href", "/category/weather");
  });

  it("renders both the Free and Subscribed pricing cards", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Subscribed" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see full pricing details/i })).toHaveAttribute("href", "/pricing");
  });
});
