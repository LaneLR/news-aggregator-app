// This file configures the initialization of Sentry on the server.
// The config here runs whenever the Node.js server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. 1 = 100% while validating the
  // setup; turn this down once real traffic arrives to control event volume.
  tracesSampleRate: 1,

  // Enable sending user PII (email, IP) with events — useful for tracing a
  // bug back to a specific account, matching the other repos' setup.
  sendDefaultPii: true,
});
