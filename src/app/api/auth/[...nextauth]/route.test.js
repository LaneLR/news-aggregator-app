import { describe, expect, it, vi } from "vitest";

// Light smoke test only, per the batch instructions: this route just
// re-exports NextAuth's handlers from @/lib/auth, so exercising a full
// OAuth flow here would be redundant with (and much heavier than) testing
// @/lib/auth directly.
vi.mock("@/lib/auth", () => ({
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

const { GET, POST } = await import("./route");

describe("GET,POST /api/auth/[...nextauth]", () => {
  it("re-exports NextAuth's GET and POST handlers", () => {
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
  });
});
