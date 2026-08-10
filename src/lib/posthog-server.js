import { PostHog } from "posthog-node";

// Server-side capture (API routes, Stripe webhooks, cron jobs) — separate
// from the browser singleton in instrumentation-client.js, which can't be
// imported outside the client bundle. Reuses the same project key; a
// PostHog project API key is meant to be public (it's already shipped to
// every browser via NEXT_PUBLIC_POSTHOG_KEY), so there's no separate
// server-only secret to configure.
//
// flushAt: 1 / flushInterval: 0 send each capture() immediately instead of
// batching — required in serverless request handlers, where the process
// can freeze or exit right after the response is sent, before posthog-node's
// default batching interval would otherwise have flushed it.
let client = null;

export function getPostHogServerClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}
