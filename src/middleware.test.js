import { afterEach, describe, expect, it, vi } from "vitest";

const { middleware } = await import("./middleware");

// vi.stubEnv isn't cleared by vitest.setup.js's global afterEach (it only
// unstubs globals) — undo it locally so MAINTENANCE_MODE doesn't leak into
// other test files.
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("middleware (maintenance mode)", () => {
  it("passes requests through untouched when MAINTENANCE_MODE isn't set", () => {
    vi.stubEnv("MAINTENANCE_MODE", "");
    const res = middleware();
    // NextResponse.next() carries this internal marker header rather than a
    // distinguishable status/body — its presence is what "passed through"
    // looks like from the outside.
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("passes requests through when MAINTENANCE_MODE is any value other than the literal string 'true'", () => {
    vi.stubEnv("MAINTENANCE_MODE", "1");
    const res = middleware();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("serves the maintenance page with a 503 when MAINTENANCE_MODE is 'true'", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "true");
    const res = middleware();

    expect(res.status).toBe(503);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Retry-After")).toBe("120");

    const body = await res.text();
    expect(body).toContain("We'll be right back");
    expect(body).toContain("MochaReads");
    expect(body).toContain('src="/images/MochaReads-M.png"');
  });

  it("keeps the copy reassuring and action-free — no hedging about 'no action needed' or justifying the outage", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "true");
    const res = middleware();
    const body = await res.text();

    expect(body).toContain("MochaReads is temporarily down while we sort out some things on our end.");
    expect(body).toContain("Please wait a few minutes and refresh the page.");
    expect(body).not.toContain("no action needed");
    expect(body).not.toContain("maintenance window");
  });

  it("shows the logo mark twice — once in the header bar, once large above the headline", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "true");
    const res = middleware();
    const body = await res.text();

    const matches = body.match(/src="\/images\/MochaReads-M\.png"/g) || [];
    expect(matches).toHaveLength(2);
  });

  it("marks the maintenance response noindex so search engines don't deindex the site over a brief outage", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "true");
    const res = middleware();
    const body = await res.text();
    expect(body).toContain('name="robots" content="noindex"');
  });
});
