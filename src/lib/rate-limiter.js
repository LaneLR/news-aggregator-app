// src/lib/rate-limiter.js
// DB-backed IP rate limiter with an escalating lockout for repeat
// offenders. This replaces an earlier in-memory version — that version's
// state lived in a single process's memory, which doesn't hold up on
// Vercel's serverless model (each request can land on a different
// instance, and a cold start wipes it entirely), so the "5 requests per
// minute" limit it enforced was really closer to "5 per minute per warm
// instance." Storing state in the Postgres DB this app already runs makes
// the limit actually shared across every instance, at no extra cost.
import initializeDbAndModels from "@/lib/db";

const RATE_LIMIT_INTERVAL_MS = 60 * 1000; // base limit: 1-minute rolling window
const MAX_REQUESTS_PER_INTERVAL = 5;

// An IP that keeps exceeding the base limit gets locked out for
// increasingly long periods — 5 minutes, then 1 hour, then a 24-hour
// ceiling — rather than one flat lockout. A few mistyped passwords barely
// slow a real person down; sustained brute-forcing gets exponentially more
// expensive within minutes. 24 hours is deliberately a ceiling, not a
// permanent ban — IP addresses get reassigned between customers over time
// (residential/mobile ISPs, CGNAT), so a "permanent" block increasingly
// punishes whoever inherits the address rather than the original attacker.
const LOCKOUT_TIERS_MS = [5 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
// A full day with no further violations resets the escalation ladder back
// to the first tier, so one past incident doesn't compound forever.
const VIOLATION_DECAY_MS = 24 * 60 * 60 * 1000;

// Next.js App Router route handlers receive a Web API `Request`, whose
// `headers` is a `Headers` instance — it must be read with `.get()`, not
// bracket/property access (which silently returns undefined).
const getClientIp = (req) => {
  const forwardedFor = req.headers?.get?.("x-forwarded-for");
  return (
    forwardedFor?.split(",").shift()?.trim() ||
    req.headers?.get?.("x-real-ip") ||
    "unknown_ip"
  );
};

function lockoutDurationMs(violationCount) {
  const tier = Math.min(violationCount, LOCKOUT_TIERS_MS.length) - 1;
  return LOCKOUT_TIERS_MS[tier];
}

function throwLockedError(lockedUntil, now) {
  const minutesLeft = Math.max(1, Math.ceil((lockedUntil - now) / 60000));
  const error = new Error(
    `Too many requests. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`
  );
  error.status = 429;
  throw error;
}

/**
 * Rate-limits a request's source IP, escalating to a temporary lockout for
 * repeat offenders. Throws an Error with `status: 429` when the caller
 * should be rejected.
 *
 * @param {Request} req The Next.js Request object.
 */
export const authRateLimitMiddleware = async (req) => {
  const ip = getClientIp(req);
  const now = new Date();
  const { IpAttempt } = await initializeDbAndModels();

  const attempt = await IpAttempt.findByPk(ip);

  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    throwLockedError(attempt.lockedUntil, now);
  }

  if (!attempt) {
    try {
      await IpAttempt.create({ ip, windowCount: 1, windowStart: now });
    } catch (err) {
      // A concurrent first-ever request from this same IP can race to
      // create the same row — harmless either way, so just let it through.
      if (err.name !== "SequelizeUniqueConstraintError") throw err;
    }
    return;
  }

  const windowExpired =
    !attempt.windowStart || now - attempt.windowStart > RATE_LIMIT_INTERVAL_MS;
  if (windowExpired) {
    await attempt.update({ windowCount: 1, windowStart: now });
    return;
  }

  const windowCount = attempt.windowCount + 1;
  if (windowCount <= MAX_REQUESTS_PER_INTERVAL) {
    await attempt.update({ windowCount });
    return;
  }

  const violationDecayed =
    !attempt.lastViolationAt || now - attempt.lastViolationAt > VIOLATION_DECAY_MS;
  const violationCount = violationDecayed ? 1 : attempt.violationCount + 1;
  const lockedUntil = new Date(now.getTime() + lockoutDurationMs(violationCount));

  await attempt.update({ windowCount, violationCount, lockedUntil, lastViolationAt: now });
  throwLockedError(lockedUntil, now);
};
