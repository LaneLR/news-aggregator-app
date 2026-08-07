// Configures Sentry on the client — runs whenever a user loads a page.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  sendDefaultPii: true,

  // Session Replay is deliberately left off — this app already handles user
  // PII (email, subscription info), and replay records DOM/network activity
  // by default. Add `Sentry.replayIntegration()` to `integrations` later if
  // that trade-off is worth it.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
