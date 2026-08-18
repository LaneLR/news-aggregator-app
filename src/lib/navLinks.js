import {
  Sparkles,
  Layers,
  BookOpen,
  LineChart,
  Briefcase,
  Cpu,
  FlaskConical,
  Trophy,
  Leaf,
  Clapperboard,
  Landmark,
  Globe,
  Flag,
  DollarSign,
  CloudSun,
  Rss,
  Mic,
} from "lucide-react";

// Shared by ReaderNavSidebar (the persistent nav — see MainContentWrapper),
// CommandPalette, HomeSectionsSettings, and OnboardingFlow, so all four stay
// in sync automatically rather than drifting out of sync by hand. Plain
// data (icon components, not JSX), so it's safe to import from both client
// and server components.
export const PERSONAL_LINKS = [
  { label: "For You", href: "/for-you", Icon: Sparkles, subscriberOnly: true },
  { label: "My Feeds", href: "/feeds", Icon: Layers, subscriberOnly: true, countKey: "feeds" },
  { label: "Following", href: "/following", Icon: Rss, countKey: "following" },
];

// Every category link is always shown to everyone — Market and Journal are
// the only two still fully locked for Free/anonymous visitors (`gated:
// true`), but clicking them lands on an in-app teaser/upsell page instead
// of a silent redirect, so the nav needs to actually surface them rather
// than hide them. Every other category (including Finance) shows a curated
// free selection of sources to non-subscribers and the rest gated
// per-source — see src/lib/subscriberOnlyCategories.js. `primary` is a
// leftover distinction from the old horizontal HeaderNavBar's primary/
// overflow split — harmless to keep on the data even though the vertical
// sidebar shows every category with no overflow menu.
export const CATEGORY_LINKS = [
  { label: "Journals", href: "/category/journal", Icon: BookOpen, gated: true, primary: true },
  { label: "Market", href: "/category/market", Icon: LineChart, gated: true, primary: true },
  { label: "Business", href: "/category/business", Icon: Briefcase, primary: true },
  { label: "Tech", href: "/category/tech", Icon: Cpu, primary: true },
  { label: "Science", href: "/category/science", Icon: FlaskConical, primary: true },
  { label: "Sports", href: "/category/sports", Icon: Trophy, primary: true },
  { label: "Lifestyle", href: "/category/lifestyle", Icon: Leaf },
  { label: "Entertainment", href: "/category/entertainment", Icon: Clapperboard },
  { label: "Politics", href: "/category/politics", Icon: Landmark },
  { label: "World", href: "/category/world", Icon: Globe },
  { label: "US", href: "/category/us", Icon: Flag },
  { label: "Finance", href: "/category/finance", Icon: DollarSign },
  { label: "Podcasts", href: "/category/podcast", Icon: Mic },
  { label: "Weather", href: "/category/weather", Icon: CloudSun },
];

// Category slugs (href's last segment) don't always match the article
// category tag's stored casing — "US" is stored uppercase, most others
// aren't — so counts are looked up case-insensitively via this helper
// rather than assuming a consistent capitalization scheme.
export const slugFromHref = (href) => href.split("/").pop();

// Standalone/single-purpose pages where the persistent category sidebar
// (ReaderNavSidebar, via MainContentWrapper) doesn't belong —
// marketing/landing, auth, legal/static, and the onboarding flow.
// Everything else (category pages, /news, /search, /archives, the article
// reader, account/settings, etc.) gets the sidebar, for every visitor —
// logged in or not. A blocklist rather than an allowlist so a new content
// page gets the sidebar automatically without needing to remember to add it
// here. Shared with Header (which needs to know whether to show a
// hamburger button that opens the same sidebar as a mobile drawer) so the
// two never drift out of sync on which pages have a sidebar to open.
const HIDDEN_SIDEBAR_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/pricing",
  "/privacy",
  "/terms-of-service",
  "/contact-us",
  "/about",
  "/forgot-password",
  "/password-reset",
  "/onboarding",
  "/subscribe",
]);

export function shouldShowSidebar(pathname) {
  if (HIDDEN_SIDEBAR_PATHS.has(pathname)) return false;
  if (pathname.startsWith("/verification/")) return false;
  return true;
}
