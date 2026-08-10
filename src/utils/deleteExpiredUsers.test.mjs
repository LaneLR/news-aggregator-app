import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStripeUpdate = vi.fn();
vi.mock("@/lib/stripe", () => ({
  default: () => ({ subscriptions: { update: mockStripeUpdate } }),
}));

const mockFindAll = vi.fn();
vi.mock("@/lib/db", () => ({
  default: vi.fn(async () => ({ User: { findAll: mockFindAll } })),
}));

const { deleteExpiredUsers } = await import("./deleteExpiredUsers.mjs");

function makeExpiredUser(overrides = {}) {
  return {
    id: "user-1",
    stripeSubscriptionId: null,
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("deleteExpiredUsers", () => {
  beforeEach(() => {
    mockFindAll.mockReset();
    mockStripeUpdate.mockReset();
  });

  it("returns 0 and does nothing when there are no users past the grace period", async () => {
    mockFindAll.mockResolvedValue([]);

    const count = await deleteExpiredUsers();

    expect(count).toBe(0);
    expect(mockStripeUpdate).not.toHaveBeenCalled();
  });

  it("deactivates a user with no Stripe subscription without touching Stripe", async () => {
    const user = makeExpiredUser();
    mockFindAll.mockResolvedValue([user]);

    const count = await deleteExpiredUsers();

    expect(count).toBe(1);
    expect(mockStripeUpdate).not.toHaveBeenCalled();
    expect(user.update).toHaveBeenCalledWith({
      status: "inactive",
      isPendingDeletion: false,
      deletionRequestedAt: null,
    });
  });

  it("cancels the Stripe subscription at period end before deactivating", async () => {
    const user = makeExpiredUser({ stripeSubscriptionId: "sub_123" });
    mockFindAll.mockResolvedValue([user]);
    mockStripeUpdate.mockResolvedValue({});

    const count = await deleteExpiredUsers();

    expect(count).toBe(1);
    expect(mockStripeUpdate).toHaveBeenCalledWith("sub_123", { cancel_at_period_end: true });
    expect(user.update).toHaveBeenCalled();
  });

  it("continues processing remaining users when one fails, and excludes it from the success count", async () => {
    const failing = makeExpiredUser({ id: "user-fail", update: vi.fn().mockRejectedValue(new Error("db error")) });
    const succeeding = makeExpiredUser({ id: "user-ok" });
    mockFindAll.mockResolvedValue([failing, succeeding]);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const count = await deleteExpiredUsers();

    expect(count).toBe(1);
    expect(succeeding.update).toHaveBeenCalled();
  });

  it("continues processing remaining users when Stripe cancellation fails", async () => {
    const failing = makeExpiredUser({ id: "user-fail", stripeSubscriptionId: "sub_bad" });
    const succeeding = makeExpiredUser({ id: "user-ok" });
    mockFindAll.mockResolvedValue([failing, succeeding]);
    mockStripeUpdate.mockRejectedValueOnce(new Error("stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const count = await deleteExpiredUsers();

    expect(count).toBe(1);
    expect(failing.update).not.toHaveBeenCalled();
    expect(succeeding.update).toHaveBeenCalled();
  });
});
