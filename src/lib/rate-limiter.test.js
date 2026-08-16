import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { authRateLimitMiddleware } = await import("./rate-limiter");

function makeRequest(headers = {}) {
  const map = new Map(Object.entries(headers));
  return { headers: { get: (name) => map.get(name) ?? null } };
}

describe("authRateLimitMiddleware", () => {
  beforeEach(() => {
    db.IpAttempt.findByPk.mockReset();
    db.IpAttempt.create.mockReset();
    db.IpAttempt.create.mockResolvedValue(createInstanceMock());
  });

  it("creates a fresh row and allows the first request from a new IP", async () => {
    db.IpAttempt.findByPk.mockResolvedValue(null);
    const req = makeRequest({ "x-forwarded-for": "10.0.0.1" });

    await expect(authRateLimitMiddleware(req)).resolves.toBeUndefined();

    expect(db.IpAttempt.findByPk).toHaveBeenCalledWith("10.0.0.1");
    expect(db.IpAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({ ip: "10.0.0.1", windowCount: 1 })
    );
  });

  it("swallows a unique-constraint race on first-request row creation", async () => {
    db.IpAttempt.findByPk.mockResolvedValue(null);
    const raceErr = new Error("duplicate key");
    raceErr.name = "SequelizeUniqueConstraintError";
    db.IpAttempt.create.mockRejectedValue(raceErr);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.2" }))
    ).resolves.toBeUndefined();
  });

  it("rethrows a genuine DB error on row creation", async () => {
    db.IpAttempt.findByPk.mockResolvedValue(null);
    db.IpAttempt.create.mockRejectedValue(new Error("connection lost"));

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.3" }))
    ).rejects.toThrow("connection lost");
  });

  it("allows requests under the base per-minute limit, incrementing windowCount", async () => {
    const attempt = createInstanceMock({
      ip: "10.0.0.4",
      windowCount: 2,
      windowStart: new Date(),
      violationCount: 0,
      lockedUntil: null,
      lastViolationAt: null,
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.4" }))
    ).resolves.toBeUndefined();

    expect(attempt.windowCount).toBe(3);
    expect(attempt.lockedUntil).toBeNull();
  });

  it("resets windowCount once the 1-minute window has expired", async () => {
    const attempt = createInstanceMock({
      ip: "10.0.0.5",
      windowCount: 5,
      windowStart: new Date(Date.now() - 61 * 1000),
      violationCount: 0,
      lockedUntil: null,
      lastViolationAt: null,
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.5" }))
    ).resolves.toBeUndefined();

    expect(attempt.windowCount).toBe(1);
  });

  it("locks the IP out for 5 minutes on a first violation of the base limit", async () => {
    const now = new Date();
    const attempt = createInstanceMock({
      ip: "10.0.0.6",
      windowCount: 5,
      windowStart: now,
      violationCount: 0,
      lockedUntil: null,
      lastViolationAt: null,
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.6" }))
    ).rejects.toMatchObject({ status: 429, message: expect.stringContaining("Too many requests") });

    expect(attempt.violationCount).toBe(1);
    // `now` is captured slightly before the middleware computes its own —
    // allow a small buffer for that real (sub-millisecond-scale) drift.
    const lockedMs = attempt.lockedUntil.getTime() - now.getTime();
    expect(lockedMs).toBeGreaterThan(4 * 60 * 1000);
    expect(lockedMs).toBeLessThanOrEqual(5 * 60 * 1000 + 30000);
  });

  it("escalates to a 1-hour lockout on a second violation within the decay window", async () => {
    const now = new Date();
    const attempt = createInstanceMock({
      ip: "10.0.0.7",
      windowCount: 5,
      windowStart: now,
      violationCount: 1,
      lockedUntil: null,
      lastViolationAt: new Date(now.getTime() - 60 * 1000), // recent — no decay
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.7" }))
    ).rejects.toMatchObject({ status: 429 });

    expect(attempt.violationCount).toBe(2);
    // See the 5-minute-tier test above for why this buffer exists.
    const lockedMs = attempt.lockedUntil.getTime() - now.getTime();
    expect(lockedMs).toBeGreaterThan(59 * 60 * 1000);
    expect(lockedMs).toBeLessThanOrEqual(60 * 60 * 1000 + 30000);
  });

  it("caps escalation at a 24-hour lockout for a third and any further violation", async () => {
    const now = new Date();
    const attempt = createInstanceMock({
      ip: "10.0.0.8",
      windowCount: 5,
      windowStart: now,
      violationCount: 5, // already well past the third violation
      lockedUntil: null,
      lastViolationAt: new Date(now.getTime() - 60 * 1000),
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.8" }))
    ).rejects.toMatchObject({ status: 429 });

    expect(attempt.violationCount).toBe(6);
    // `now` is captured slightly before the middleware computes its own —
    // allow a small buffer for that real (sub-millisecond-scale) drift.
    const lockedMs = attempt.lockedUntil.getTime() - now.getTime();
    expect(lockedMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(lockedMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 30000);
  });

  it("resets the escalation ladder back to the first tier after 24 hours with no violations", async () => {
    const now = new Date();
    const attempt = createInstanceMock({
      ip: "10.0.0.9",
      windowCount: 5,
      windowStart: now,
      violationCount: 6, // was previously at the 24h ceiling...
      lockedUntil: null,
      lastViolationAt: new Date(now.getTime() - 25 * 60 * 60 * 1000), // ...but that was over a day ago
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.9" }))
    ).rejects.toMatchObject({ status: 429 });

    expect(attempt.violationCount).toBe(1); // ladder restarted
    const lockedMs = attempt.lockedUntil.getTime() - now.getTime();
    expect(lockedMs).toBeLessThanOrEqual(5 * 60 * 1000 + 30000); // back to tier 1
  });

  it("rejects immediately while still locked out, without touching windowCount", async () => {
    const now = new Date();
    const attempt = createInstanceMock({
      ip: "10.0.0.10",
      windowCount: 0,
      windowStart: now,
      violationCount: 2,
      lockedUntil: new Date(now.getTime() + 10 * 60 * 1000),
      lastViolationAt: now,
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.10" }))
    ).rejects.toMatchObject({ status: 429 });

    expect(attempt.windowCount).toBe(0); // untouched — rejected before any counting
  });

  it("allows requests again once a past lockout has expired", async () => {
    const now = new Date();
    const attempt = createInstanceMock({
      ip: "10.0.0.11",
      windowCount: 5,
      windowStart: new Date(now.getTime() - 61 * 1000),
      violationCount: 1,
      lockedUntil: new Date(now.getTime() - 1000), // expired a second ago
      lastViolationAt: new Date(now.getTime() - 61 * 1000),
    });
    db.IpAttempt.findByPk.mockResolvedValue(attempt);

    await expect(
      authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.11" }))
    ).resolves.toBeUndefined();
  });

  it("tracks each IP independently", async () => {
    db.IpAttempt.findByPk.mockResolvedValue(null);

    await authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.12" }));
    await authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.13" }));

    expect(db.IpAttempt.findByPk).toHaveBeenNthCalledWith(1, "10.0.0.12");
    expect(db.IpAttempt.findByPk).toHaveBeenNthCalledWith(2, "10.0.0.13");
  });

  it("uses the first address in a comma-separated x-forwarded-for header", async () => {
    db.IpAttempt.findByPk.mockResolvedValue(null);
    await authRateLimitMiddleware(makeRequest({ "x-forwarded-for": "10.0.0.14, 203.0.113.5" }));
    expect(db.IpAttempt.findByPk).toHaveBeenCalledWith("10.0.0.14");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    db.IpAttempt.findByPk.mockResolvedValue(null);
    await authRateLimitMiddleware(makeRequest({ "x-real-ip": "10.0.0.15" }));
    expect(db.IpAttempt.findByPk).toHaveBeenCalledWith("10.0.0.15");
  });

  it("falls back to a shared 'unknown_ip' bucket when neither header is present", async () => {
    db.IpAttempt.findByPk.mockResolvedValue(null);
    await authRateLimitMiddleware(makeRequest({}));
    expect(db.IpAttempt.findByPk).toHaveBeenCalledWith("unknown_ip");
  });
});
