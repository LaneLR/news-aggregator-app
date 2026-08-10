import { describe, expect, it } from "vitest";
import defineProcessedStripeEvent from "./ProcessedStripeEvent";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const ProcessedStripeEvent = defineProcessedStripeEvent(sequelize);

describe("ProcessedStripeEvent model", () => {
  it("passes validation with id and type present", async () => {
    const event = ProcessedStripeEvent.build({ id: "evt_123", type: "customer.subscription.updated" });
    await expect(event.validate()).resolves.toBeDefined();
  });

  it("fails validation when type is missing", async () => {
    const event = ProcessedStripeEvent.build({ id: "evt_123" });
    await expect(event.validate()).rejects.toThrow();
  });

  it("has no updatedAt column, since it's disabled in the model options", () => {
    expect(ProcessedStripeEvent.rawAttributes).not.toHaveProperty("updatedAt");
    expect(ProcessedStripeEvent.rawAttributes).toHaveProperty("createdAt");
  });
});
