// Configures Sentry + PostHog on the client — runs whenever a user loads a
// page, before hydration (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  sendDefaultPii: true,

  // Session Replay is deliberately left off — this app already handles user
  // PII (email, subscription info), and replay records DOM/network activity
  // by default. Add `Sentry.replayIntegration()` to `integrations` later if
  // that trade-off is worth it.
});

// PostHog — product analytics. Guarded so local/CI environments without a
// key configured don't try to reach the network at all.
if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    // Opts into every current "modern default" at once — most relevantly
    // capture_pageview: 'history_change'. The App Router navigates via
    // history.pushState (no full page load), so this is what makes
    // pageviews get captured at all, without a separate manual
    // usePathname/useSearchParams pageview-tracking component.
    defaults: "2026-06-25",
    // person_profiles defaults to 'identified_only' — anonymous visitors
    // (the vast majority of traffic to a marketing/reading site) don't get
    // a billed person profile, only users who actually sign in do (see
    // PostHogProvider.jsx's identify call). Left implicit since it's
    // already the library default.
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
