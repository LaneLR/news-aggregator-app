import { describe, expect, it } from "vitest";
import defineIpAttempt from "./IpAttempt";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const IpAttempt = defineIpAttempt(sequelize);

describe("IpAttempt model", () => {
  it("applies default 0 for windowCount and violationCount", () => {
    const attempt = IpAttempt.build({ ip: "10.0.0.1" });
    expect(attempt.windowCount).toBe(0);
    expect(attempt.violationCount).toBe(0);
  });

  it("passes validation with just an ip", async () => {
    const attempt = IpAttempt.build({ ip: "10.0.0.1" });
    await expect(attempt.validate()).resolves.toBeDefined();
  });

  it("fails validation when ip is missing", async () => {
    const attempt = IpAttempt.build({});
    await expect(attempt.validate()).rejects.toThrow();
  });

  it("leaves windowStart, lockedUntil, and lastViolationAt unset until explicitly assigned", () => {
    const attempt = IpAttempt.build({ ip: "10.0.0.1" });
    expect(attempt.windowStart).toBeUndefined();
    expect(attempt.lockedUntil).toBeUndefined();
    expect(attempt.lastViolationAt).toBeUndefined();
  });

  it("stores an explicit lockedUntil", () => {
    const lockedUntil = new Date("2026-01-01T00:00:00.000Z");
    const attempt = IpAttempt.build({ ip: "10.0.0.1", lockedUntil });
    expect(attempt.lockedUntil).toEqual(lockedUntil);
  });
});
