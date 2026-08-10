import { describe, expect, it, vi, beforeEach } from "vitest";

// `new Stripe(...)` requires a real constructor function — an arrow-function
// mockImplementation can't be invoked with `new`.
const StripeMock = vi.fn().mockImplementation(function (key) {
  this.key = key;
});

vi.mock("stripe", () => ({
  default: StripeMock,
}));

describe("getStripe", () => {
  beforeEach(() => {
    vi.resetModules();
    StripeMock.mockClear();
  });

  it("constructs a Stripe client using the secret key env var", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    const getStripe = (await import("./stripe")).default;

    const client = getStripe();
    expect(StripeMock).toHaveBeenCalledWith("sk_test_123");
    expect(client.key).toBe("sk_test_123");
  });

  it("only constructs the client once (singleton)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    const getStripe = (await import("./stripe")).default;

    const first = getStripe();
    const second = getStripe();
    expect(first).toBe(second);
    expect(StripeMock).toHaveBeenCalledTimes(1);
  });
});
