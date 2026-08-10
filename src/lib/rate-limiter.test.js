import { describe, expect, it } from "vitest";
import { authRateLimitMiddleware } from "./rate-limiter";

// requestCounts is a module-level singleton Map keyed by IP, so each test
// uses its own unique IP (via a unique x-forwarded-for value) to avoid
// cross-test contamination rather than trying to reset internal state.
let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

function makeRequest(headers = {}) {
  const map = new Map(Object.entries(headers));
  return { headers: { get: (name) => map.get(name) ?? null } };
}

describe("authRateLimitMiddleware", () => {
  it("allows requests under the limit", async () => {
    const ip = nextIp();
    const req = makeRequest({ "x-forwarded-for": ip });
    for (let i = 0; i < 5; i++) {
      await expect(authRateLimitMiddleware(req)).resolves.toBeUndefined();
    }
  });

  it("throws a 429 error once the limit is exceeded within the interval", async () => {
    const ip = nextIp();
    const req = makeRequest({ "x-forwarded-for": ip });
    for (let i = 0; i < 5; i++) {
      await authRateLimitMiddleware(req);
    }

    await expect(authRateLimitMiddleware(req)).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining("Too many requests"),
    });
  });

  it("tracks each IP independently", async () => {
    const ipA = nextIp();
    const ipB = nextIp();
    const reqA = makeRequest({ "x-forwarded-for": ipA });
    const reqB = makeRequest({ "x-forwarded-for": ipB });

    for (let i = 0; i < 5; i++) {
      await authRateLimitMiddleware(reqA);
    }
    // ipB has made no requests yet, so it should still be allowed.
    await expect(authRateLimitMiddleware(reqB)).resolves.toBeUndefined();
    // ipA is now over the limit.
    await expect(authRateLimitMiddleware(reqA)).rejects.toMatchObject({ status: 429 });
  });

  it("uses the first address in a comma-separated x-forwarded-for header", async () => {
    const ip = nextIp();
    const req = makeRequest({ "x-forwarded-for": `${ip}, 203.0.113.5` });
    await expect(authRateLimitMiddleware(req)).resolves.toBeUndefined();
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    const ip = nextIp();
    const req = makeRequest({ "x-real-ip": ip });
    await expect(authRateLimitMiddleware(req)).resolves.toBeUndefined();
  });

  it("falls back to a shared 'unknown_ip' bucket when neither header is present", async () => {
    const req = makeRequest({});
    // Just confirm it doesn't throw on a single call — the bucket is shared
    // across any caller lacking both headers, so we don't assert exhaustion
    // here to avoid interfering with other tests hitting the same bucket.
    await expect(authRateLimitMiddleware(req)).resolves.toBeUndefined();
  });
});
