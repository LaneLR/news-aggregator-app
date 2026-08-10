import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockSendEmail = vi.fn();
vi.mock("@/utils/emailer", () => ({ sendEmail: (...args) => mockSendEmail(...args) }));

const mockStripe = {
  webhooks: { constructEvent: vi.fn() },
  subscriptions: { retrieve: vi.fn() },
  customers: { createBalanceTransaction: vi.fn() },
};
vi.mock("@/lib/stripe", () => ({ default: () => mockStripe }));

const { POST } = await import("./route");

function makeRequest(rawBody = "{}", signature = "t=1,v1=validsig") {
  const headers = {};
  if (signature !== null) headers["stripe-signature"] = signature;
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: rawBody,
    headers,
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    mockStripe.webhooks.constructEvent.mockReset();
    mockStripe.subscriptions.retrieve.mockReset();
    mockStripe.customers.createBalanceTransaction.mockReset();
    mockSendEmail.mockReset().mockResolvedValue(undefined);
    db.User.findByPk.mockReset();
    db.User.findOne.mockReset();
    db.ProcessedStripeEvent.create.mockReset().mockResolvedValue({});
  });

  it("returns 400 when signature verification fails", async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
  });

  it("returns received:true without reprocessing a duplicate event", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({ id: "evt_1", type: "checkout.session.completed" });
    const err = new Error("dup");
    err.name = "SequelizeUniqueConstraintError";
    db.ProcessedStripeEvent.create.mockRejectedValue(err);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    expect(db.User.findByPk).not.toHaveBeenCalled();
  });

  it("returns 500 when recording the event itself fails unexpectedly", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({ id: "evt_1", type: "checkout.session.completed" });
    db.ProcessedStripeEvent.create.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  describe("checkout.session.completed", () => {
    function event(overrides = {}) {
      return {
        id: "evt_1",
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: "user-1",
            subscription: "sub_123",
            metadata: {},
            ...overrides,
          },
        },
      };
    }

    it("upgrades the user to Subscribed and sends a welcome email", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(event());
      const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
      db.User.findByPk.mockResolvedValue(user);
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: "sub_123",
        customer: "cus_1",
        status: "active",
        items: { data: [{ price: { id: "price_1" }, current_period_end: 1893456000 }] },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: "Subscribed",
          stripeCustomerId: "cus_1",
          stripeSubscriptionId: "sub_123",
          stripeSubscriptionStatus: "active",
        })
      );
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "a@example.com", subject: expect.stringContaining("Welcome") })
      );
    });

    it("credits the referrer with a balance transaction when a referral code was used", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(
        event({ metadata: { usedReferralCode: "REF1", referrerId: "referrer-1" } })
      );
      const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
      const referrer = createInstanceMock({ id: "referrer-1", stripeCustomerId: "cus_ref" });
      referrer.increment = vi.fn();
      db.User.findByPk.mockResolvedValueOnce(user).mockResolvedValueOnce(referrer);
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: "sub_123",
        customer: "cus_1",
        status: "active",
        items: { data: [{ price: { id: "price_1" }, current_period_end: 1893456000 }] },
      });

      await POST(makeRequest());

      expect(referrer.increment).toHaveBeenCalledWith("referralCount");
      expect(mockStripe.customers.createBalanceTransaction).toHaveBeenCalledWith(
        "cus_ref",
        expect.objectContaining({ amount: -400 })
      );
    });

    it("does nothing when the referenced user no longer exists", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(event());
      db.User.findByPk.mockResolvedValue(null);

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  describe("customer.subscription.updated", () => {
    function event(subscriptionOverrides = {}, previousAttributes = {}) {
      return {
        id: "evt_2",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_123",
            status: "active",
            cancel_at_period_end: false,
            cancel_at: null,
            current_period_end: 1893456000,
            items: { data: [{ price: { id: "price_1" }, current_period_end: 1893456000 }] },
            ...subscriptionOverrides,
          },
          previous_attributes: previousAttributes,
        },
      };
    }

    it("does nothing when no user has that subscription id", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(event());
      db.User.findOne.mockResolvedValue(null);

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("sends a billing-updated email when the price changed", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(event({}, { items: {} }));
      const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
      db.User.findOne.mockResolvedValue(user);

      await POST(makeRequest());

      expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ tier: "Subscribed" }));
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: expect.stringContaining("Updated") })
      );
    });

    it("sends a cancellation-confirmed email when cancel_at_period_end newly turns on", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(
        event(
          { cancel_at_period_end: true, cancel_at: 1893456000 },
          { cancel_at_period_end: false }
        )
      );
      const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
      db.User.findOne.mockResolvedValue(user);

      await POST(makeRequest());

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: expect.stringContaining("Cancellation") })
      );
    });

    it("sends a resumed email when cancel_at_period_end turns back off", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue(
        event({ cancel_at_period_end: false }, { cancel_at_period_end: true })
      );
      const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
      db.User.findOne.mockResolvedValue(user);

      await POST(makeRequest());

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: expect.stringContaining("Resumed") })
      );
    });
  });

  describe("customer.subscription.deleted", () => {
    it("downgrades the user back to Free", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: "evt_3",
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_123" } },
      });
      const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
      db.User.findOne.mockResolvedValue(user);

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({ tier: "Free", stripeSubscriptionId: null })
      );
    });

    it("does nothing when no matching user is found", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: "evt_3",
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_123" } },
      });
      db.User.findOne.mockResolvedValue(null);

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
    });
  });

  describe("invoice.payment_failed", () => {
    it("warns the user by email without downgrading", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: "evt_4",
        type: "invoice.payment_failed",
        data: { object: { subscription: "sub_123" } },
      });
      const user = createInstanceMock({ id: "user-1", email: "a@example.com" });
      db.User.findOne.mockResolvedValue(user);

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(user.update).not.toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: expect.stringContaining("couldn't process") })
      );
    });

    it("skips invoices with no subscription attached", async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: "evt_4",
        type: "invoice.payment_failed",
        data: { object: { subscription: null } },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(db.User.findOne).not.toHaveBeenCalled();
    });
  });

  it("acknowledges an unhandled event type without error", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({ id: "evt_5", type: "some.other.event" });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
  });

  it("returns 500 when a handler throws mid-processing", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      id: "evt_6",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "user-1", subscription: "sub_123", metadata: {} } },
    });
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });
});
