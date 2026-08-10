import { describe, expect, it } from "vitest";
import definePushSubscription from "./PushSubscription";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const PushSubscription = definePushSubscription(sequelize);

function validSubscription(overrides = {}) {
  return PushSubscription.build({
    userId: "user-1",
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    p256dh: "p256dh-key",
    auth: "auth-key",
    ...overrides,
  });
}

describe("PushSubscription model", () => {
  it("passes validation with all required fields present", async () => {
    await expect(validSubscription().validate()).resolves.toBeDefined();
  });

  it("fails validation when endpoint is missing", async () => {
    const sub = PushSubscription.build({ userId: "user-1", p256dh: "a", auth: "b" });
    await expect(sub.validate()).rejects.toThrow();
  });

  it("fails validation when p256dh is missing", async () => {
    const sub = PushSubscription.build({ userId: "user-1", endpoint: "https://x", auth: "b" });
    await expect(sub.validate()).rejects.toThrow();
  });

  it("fails validation when auth is missing", async () => {
    const sub = PushSubscription.build({ userId: "user-1", endpoint: "https://x", p256dh: "a" });
    await expect(sub.validate()).rejects.toThrow();
  });
});
