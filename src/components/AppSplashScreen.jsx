"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./AppSplashScreen.module.scss";

// Long enough for the logo's own entrance animation to actually play out and
// read as a deliberate brand moment, short enough that it never feels like
// it's blocking the app — same idea as YouTube's own splash. Not tied to any
// real loading state: by the time this component mounts at all, the page
// has already been server-rendered, so there's nothing left to wait on
// except giving the animation room to breathe.
const MIN_DISPLAY_MS = 1100;
const FADE_MS = 350;

// The native Capacitor splash (a static image, configured in the wrapper's
// capacitor.config.ts) covers the instant before any web content exists at
// all, then NativeSplashHandler.jsx hides it the moment this app mounts —
// at which point, without this, the very next thing a user saw was a flash
// of the page's own background followed by whatever raw loading.jsx dots
// happened to be mid-fetch. This picks up exactly where the native splash
// leaves off, on the same dark background (matching capacitor.config.ts's
// SplashScreen.backgroundColor) so the handoff between the two reads as one
// continuous moment, not two — or three, counting the gap.
//
// Starting the phase state at "visible" (not "hidden", flipped on mount via
// an effect) is the actual fix for that gap: layout.jsx only ever renders
// this component at all when the *server* already knows the request is
// from the wrapped app (isNativeApp, resolved from the request's own
// User-Agent header — see isNativeAppRequest.js), so there's no client-side
// detection left to wait on here. Server-rendering "visible" as this
// component's very first output means the overlay is present in the actual
// HTML the WebView paints first, not something that pops in a tick after
// hydration — no client-only useEffect can render before the browser's own
// first paint, no matter how early it runs.
export default function AppSplashScreen() {
  const [phase, setPhase] = useState("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), MIN_DISPLAY_MS);
    const removeTimer = setTimeout(() => setPhase("hidden"), MIN_DISPLAY_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`${styles.overlay} ${phase === "fading" ? styles.fadingOut : ""}`}
      aria-hidden="true"
    >
      <div className={styles.logoMark}>
        <Image src="/images/MochaReads-M.png" alt="" width={96} height={88} priority />
      </div>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
