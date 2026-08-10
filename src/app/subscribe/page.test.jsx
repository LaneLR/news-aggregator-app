import { describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: SubscribePage } = await import("./page");

describe("SubscribePage", () => {
  it("redirects to /pricing", () => {
    expect(() => SubscribePage()).toThrow("REDIRECT:/pricing");
  });
});
