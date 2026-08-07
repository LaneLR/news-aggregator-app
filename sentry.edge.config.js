// This file configures the initialization of Sentry for edge features
// (middleware, edge routes). Required even though this app doesn't
// currently run anything on the edge runtime — Next.js still loads it.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  sendDefaultPii: true,
});
