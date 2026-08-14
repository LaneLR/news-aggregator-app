// Badge color per article category — used on card thumbnails. Kept as a
// flat lookup (not theme-aware) since these are content-classification
// colors, not brand colors, and stay legible over a photo in both themes.
//
// Every value here is paired with white badge text (see .categoryBadge),
// so each one is chosen (or, for 8 of these, darkened one shade from the
// original) to clear 4.5:1 contrast against white — confirmed via axe-core
// scan, not assumed. The lighter originals (green-600, orange-600,
// cyan-600, emerald-600, teal-600, amber-600, sky-500) all failed at
// 2.8-3.8:1.
const CATEGORY_COLORS = {
  Business: "#15803d",
  Tech: "#2e5ce6",
  Technology: "#2e5ce6",
  Science: "#7c3aed",
  Sports: "#c2410c",
  Entertainment: "#db2777",
  Politics: "#475569",
  World: "#0e7490",
  US: "#1d4ed8",
  Finance: "#047857",
  Economy: "#0f766e",
  Lifestyle: "#c026d3",
  Food: "#b45309",
  Gaming: "#4f46e5",
  Journal: "#1e3a8a",
  Market: "#047857",
  Weather: "#0369a1",
  Podcast: "#6d28d9",
};

const DEFAULT_COLOR = "#334155";

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}
