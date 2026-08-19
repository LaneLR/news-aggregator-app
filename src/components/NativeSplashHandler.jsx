"use client";
import { useEffect } from "react";
import { isRunningInNativeApp } from "@/lib/nativeApp";

// The wrapped iOS app shows a native splash (the MochaReads "M" mark plus a
// spinner — see mochareads-webview's capacitor.config.ts) the instant the
// app launches, before the WebView has any content. That plugin is
// configured with launchAutoHide off, so it stays up indefinitely — covering
// the awkward moment where the WebView is blank or mid-load — until this
// runs once the real page has actually mounted and paints something. Renders
// nothing; @capacitor/splash-screen is only ever imported when actually
// running inside the native app, so normal web visitors never pull it in.
export default function NativeSplashHandler() {
  useEffect(() => {
    if (!isRunningInNativeApp()) return;
    let cancelled = false;
    (async () => {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      if (!cancelled) await SplashScreen.hide();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
