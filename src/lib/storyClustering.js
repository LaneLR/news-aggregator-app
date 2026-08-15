import { Op } from "sequelize";
import { orderByDesc } from "./dbOrder";

// Heuristic story-similarity, not ML/embeddings — deliberately simple given
// there's no vector-search infra in this stack. Computed on demand over a
// bounded recent window rather than persisted/batch-jobbed.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "by", "from", "as", "is", "are", "was", "were", "be", "been", "being",
  "it", "its", "this", "that", "these", "those", "after", "before", "over",
  "under", "into", "about", "new", "says", "say", "said", "how", "why",
  "what", "who", "will", "has", "have", "had", "up", "down", "out", "off",
  "not", "no", "yes", "vs", "amid",
]);

function significantWords(title) {
  return new Set(
    (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccardSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Tuned by hand against a handful of sample headlines, not real production
// data — revisit once there's a real corpus of same-story-different-outlet
// pairs to calibrate against. Lower = more clustering (more false positives
// from stories that just share a name/company); higher = more misses.
const SIMILARITY_THRESHOLD = 0.28;
const WINDOW_HOURS = 48;
const CANDIDATE_LIMIT = 300;

// Other articles covering roughly the same story as `article` — shared
// category + recent window + significant-title-word overlap.
export async function getRelatedCoverage(Article, article, limit = 6) {
  if (!article.category?.length) return [];

  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
  const candidates = await Article.findAll({
    where: {
      id: { [Op.ne]: article.id },
      category: { [Op.overlap]: article.category },
      publishedAt: { [Op.gte]: since },
    },
    order: [orderByDesc(Article, "publishedAt")],
    limit: CANDIDATE_LIMIT,
  });

  const targetWords = significantWords(article.title);
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: jaccardSimilarity(targetWords, significantWords(candidate.title)),
    }))
    .filter((c) => c.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((c) => c.candidate);
}

// Groups a list of already-fetched plain article objects (not Sequelize
// instances) into clusters for a "Top Stories" view — same heuristic,
// applied pairwise across the whole list instead of against one target.
export function clusterArticles(articles, { maxClusters = 8 } = {}) {
  const withWords = articles.map((a) => ({ article: a, words: significantWords(a.title) }));
  const clusters = [];
  const used = new Set();

  for (let i = 0; i < withWords.length; i++) {
    if (used.has(i)) continue;
    const group = [withWords[i].article];
    used.add(i);

    for (let j = i + 1; j < withWords.length; j++) {
      if (used.has(j)) continue;
      const sameCategory = (withWords[i].article.category || []).some((c) =>
        (withWords[j].article.category || []).includes(c)
      );
      if (!sameCategory) continue;

      if (jaccardSimilarity(withWords[i].words, withWords[j].words) >= SIMILARITY_THRESHOLD) {
        group.push(withWords[j].article);
        used.add(j);
      }
    }

    if (group.length >= 2) clusters.push(group);
  }

  return clusters.sort((a, b) => b.length - a.length).slice(0, maxClusters);
}
