"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// Ties PostHog's identity to NextAuth's session rather than to app login
// events specifically, so identify() also fires correctly after e.g. a
// page refresh that restores an existing session. posthog.identify() is
// idempotent to call again with the same id, but this still tracks the
// last-identified id locally to avoid firing on every session-object
// re-render (useSession() returns a new object reference often).
function PostHogIdentify() {
  const { data: session, status } = useSession();
  const identifiedId = useRef(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || status === "loading") return;

    const userId = session?.user?.id || null;
    if (userId) {
      if (identifiedId.current !== userId) {
        posthog.identify(userId, { email: session.user.email });
        identifiedId.current = userId;
      }
    } else if (identifiedId.current) {
      // Logged out — stop attributing further anonymous events to the
      // previous person and start a fresh anonymous id.
      posthog.reset();
      identifiedId.current = null;
    }
  }, [session, status]);

  return null;
}

// posthog.init() already ran in instrumentation-client.js, before
// hydration — this just gives the component tree React context around
// that same singleton (usePostHog(), useFeatureFlagEnabled(),
// PostHogErrorBoundary, etc.), it doesn't re-initialize anything.
export default function PostHogProvider({ children }) {
  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}
