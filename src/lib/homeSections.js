// Canonical list of things selectable as /news homepage sections — the two
// "hero" rows (the For You/Trending carousel, and Top Stories) plus every
// category tag. Plain strings so this is safe to import from both client
// components (HomeSectionsSettings) and server API routes, unlike
// HeaderNavBar's CATEGORY_LINKS (a "use client" file carrying icon
// components) or NewNewsPage's own display-only icon/subtitle maps.
export const CATEGORY_SECTION_TAGS = [
  "Business",
  "Tech",
  "Science",
  "Sports",
  "Lifestyle",
  "Entertainment",
  "Politics",
  "World",
  "US",
  "Weather",
  "Journal",
  "Market",
  "Finance",
  "Podcast",
];

// "today" sits between the two — a chronological, cross-category "what's
// published since local midnight" row, not a personalized feed or a
// clustered-by-coverage one — but it's driven by the same show/hide toggle
// mechanism as forYou/topStories, so it lives in this same list rather than
// alongside CATEGORY_SECTION_TAGS (it isn't a category: no articles are
// tagged "today", it's a time filter over every category at once).
export const HERO_SECTION_KEYS = ["forYou", "today", "topStories"];

export const ALL_SECTION_KEYS = [...HERO_SECTION_KEYS, ...CATEGORY_SECTION_TAGS];

// Matches the 5 categories /api/news-by-category always fetched before this
// became configurable, plus every hero row — existing users with their own
// already-saved homeSections won't see a newly-added default here (or any
// future one) until they open Settings themselves and opt in; only accounts
// that have never customized this pick up new defaults automatically.
export const DEFAULT_HOME_SECTIONS = [
  "forYou",
  "today",
  "topStories",
  "Business",
  "Tech",
  "Entertainment",
  "Sports",
  "Science",
];
