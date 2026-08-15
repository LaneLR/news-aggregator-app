import { vi } from "vitest";

// Plain-object fixtures matching each model's real shape (see
// src/lib/models/*.js) — imported by both component tests (as props) and
// API-route tests (as mocked findOne/findAll return values), so a schema
// change only needs updating here rather than in every consuming test.

let idCounter = 0;
export function nextId(prefix = "id") {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function makeArticle(overrides = {}) {
  return {
    id: nextId("article"),
    title: "Test Article Headline",
    url: "https://example.com/article",
    urlToImage: "https://example.com/image.jpg",
    sourceName: "Example News",
    publishedAt: "2026-01-01T12:00:00.000Z",
    country: "us",
    category: ["Business"],
    likeCount: 0,
    clickCount: 0,
    sourceType: "news",
    content: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

export function makeUser(overrides = {}) {
  return {
    id: nextId("user"),
    name: "Test User",
    email: "test@example.com",
    tier: "Free",
    status: "active",
    emailIsVerified: true,
    isPendingDeletion: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionStatus: null,
    stripeSubscriptionEndsAt: null,
    subscriptionWillCancel: false,
    referralCode: "REF12345",
    referralCount: 0,
    usedReferralCode: null,
    selectedTheme: null,
    digestEnabled: false,
    digestFrequency: "weekly",
    onboardingCompleted: true,
    mutedKeywords: [],
    followedKeywords: [],
    followedSources: [],
    preferredCategories: [],
    preferredSources: [],
    watchlistSymbols: [],
    homeSections: ["forYou", "topStories"],
    viewDensity: "reader",
    keyboardShortcuts: {
      next: "j",
      prev: "k",
      open: "o",
      save: "s",
      like: "l",
      search: "/",
      help: "?",
    },
    ...overrides,
  };
}

// Matches the session.user shape built in src/lib/auth.js's session()
// callback (a superset of makeUser's fields, projected through the JWT).
export function makeSession(userOverrides = {}) {
  const user = makeUser(userOverrides);
  return {
    user,
    expires: "2099-01-01T00:00:00.000Z",
  };
}

export function makeArchive(overrides = {}) {
  return {
    id: nextId("archive"),
    name: "Saved for later",
    userId: "user-1",
    isPublic: false,
    shareSlug: null,
    order: 0,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

// A minimal fetch Response-like object, for mocking `global.fetch` return
// values in any test (component or route) that calls fetch() directly.
export function makeFetchResponse(body, { ok = true, status = ok ? 200 : 500 } = {}) {
  return {
    ok,
    status,
    json: vi.fn(async () => body),
    text: vi.fn(async () => (typeof body === "string" ? body : JSON.stringify(body))),
  };
}
