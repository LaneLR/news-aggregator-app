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

export const HERO_SECTION_KEYS = ["forYou", "topStories"];

export const ALL_SECTION_KEYS = [...HERO_SECTION_KEYS, ...CATEGORY_SECTION_TAGS];

// Matches the 5 categories /api/news-by-category always fetched before this
// became configurable, plus both hero rows — existing users' homepages
// don't change at all until they actually open the new setting.
export const DEFAULT_HOME_SECTIONS = [
  "forYou",
  "topStories",
  "Business",
  "Tech",
  "Entertainment",
  "Sports",
  "Science",
];
