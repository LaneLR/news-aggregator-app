import { headers } from "next/headers";
import { NATIVE_APP_UA_MARKER } from "./nativeApp";

// Server Component counterpart to nativeApp.js's isRunningInNativeApp() —
// that one reads navigator.userAgent client-side, which isn't available (and
// would flash the wrong branch before hydration) for decisions that need to
// be correct on the very first server-rendered response, like redirecting
// the logged-out landing page or hiding the header logo. Sniffs the same UA
// marker from the incoming request's own header instead. Never import this
// from a "use client" file — next/headers only works in Server Components.
export async function isNativeAppRequest() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  return userAgent.includes(NATIVE_APP_UA_MARKER);
}
