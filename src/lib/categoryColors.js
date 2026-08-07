// Badge color per article category — used on card thumbnails. Kept as a
// flat lookup (not theme-aware) since these are content-classification
// colors, not brand colors, and stay legible over a photo in both themes.
const CATEGORY_COLORS = {
  Business: "#16a34a",
  Tech: "#2e5ce6",
  Technology: "#2e5ce6",
  Science: "#7c3aed",
  Health: "#e11d48",
  Sports: "#ea580c",
  Entertainment: "#db2777",
  Politics: "#475569",
  World: "#0891b2",
  US: "#1d4ed8",
  Finance: "#059669",
  Economy: "#0d9488",
  Lifestyle: "#c026d3",
  Food: "#d97706",
  Gaming: "#4f46e5",
  Journal: "#1e3a8a",
  Market: "#059669",
  Weather: "#0ea5e9",
};

const DEFAULT_COLOR = "#334155";

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}
