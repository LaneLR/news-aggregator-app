import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Every process.env value any module reads at import time (not just inside
// a function body) needs a value before that module is ever imported, since
// ESM imports are hoisted above test code. Centralizing them here means
// individual test files don't each need their own dummy values just to
// avoid an import-time crash.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  NEXTAUTH_SECRET: "test-secret-not-real",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
  CRON_SECRET: "test-cron-secret",
  RESEND_API_KEY: "test-resend-key",
  EMAIL_FROM: "Test <test@example.com>",
  CONTACT_EMAIL: "test@example.com",
  GOOGLE_CLIENT_ID: "test-google-client-id",
  GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_dummy",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_test_dummy",
  FINNHUB_API_KEY: "test-finnhub-key",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test-vapid-public",
  VAPID_PRIVATE_KEY: "test-vapid-private",
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (typeof localStorage !== "undefined") localStorage.clear();
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
});

// jsdom implements neither of these; several components call them
// (NewsCardThree keyboard-focus scroll, focus-trap restoration, etc.).
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView ??= vi.fn();
  window.matchMedia ??=
    vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
}

// IntersectionObserver/ResizeObserver aren't implemented in jsdom — stubbed
// as globals rather than per-test so infinite-scroll (SearchFeed) and
// visibility-observer (PostHogCaptureOnViewed-style) components don't need
// their own setup just to mount.
class MockObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.IntersectionObserver ??= MockObserver;
globalThis.ResizeObserver ??= MockObserver;

// Guards against any test accidentally hitting the real network — every
// component/lib fetch call must be explicitly mocked per-test
// (global.fetch.mockResolvedValueOnce(...) etc.) rather than falling
// through to Node's real fetch.
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.reject(new Error("fetch was called without a test-provided mock"))
  );
});

// next/font/google requires network access to fetch font files at build
// time, which fails hard under Vitest. The actual font choice has no
// behavioral effect worth testing — every consumer just needs the
// `.variable` class-name shape it normally returns.
vi.mock("next/font/google", () => ({
  Roboto: () => ({ variable: "--font-roboto", className: "roboto" }),
  Lora: () => ({ variable: "--font-lora", className: "lora" }),
}));

// next/font/local (used for the self-hosted Roboto/Lora files — see
// src/app/layout.jsx) relies on a Next-specific webpack/SWC loader to turn
// a font file import into font metadata, which doesn't exist outside of
// Next's own build pipeline — calling the real thing under Vitest throws.
// Same reasoning as next/font/google above: only the `.variable` shape
// matters to any consumer.
vi.mock("next/font/local", () => ({
  default: () => ({ variable: "--font-local", className: "local-font" }),
}));
