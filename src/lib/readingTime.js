import sanitizeHtml from "sanitize-html";

const WORDS_PER_MINUTE = 225;

// Strips tags the same way the article-page excerpt does (see
// src/app/article/[id]/page.js's excerptFrom) to get a plain-text word
// count, then converts to a rounded-up minute estimate.
export function estimateReadingTime(html) {
  if (!html) return null;

  const plainText = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!plainText) return null;

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
