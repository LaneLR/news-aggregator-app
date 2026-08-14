// Matches the appendUserAgent value configured in the separate Capacitor
// wrapper project's capacitor.config.ts (ios/android) — lets this website
// tell it's being rendered inside the wrapped mobile app vs. a normal
// browser tab, with no other coupling between the two repos.
const NATIVE_APP_UA_MARKER = "MochaReads-Mobile-App";

export function isRunningInNativeApp() {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.includes(NATIVE_APP_UA_MARKER);
}

// Apple's Reader App exception (App Store Review Guideline 3.1.3) requires
// that a subscription purchase or management flow never run inside the
// wrapped app's own WebView — it has to hand off to the system browser
// instead, or Apple treats it as bypassing their in-app purchase system
// (Guideline 3.1.1). @capacitor/browser is only ever imported when actually
// running inside the native app, so normal web visitors never pull in or
// depend on it.
export async function openPaymentUrl(url) {
  if (isRunningInNativeApp()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  window.location.href = url;
}
