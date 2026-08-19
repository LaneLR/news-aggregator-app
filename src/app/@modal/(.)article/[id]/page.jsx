import { resolveArticleForPage } from "@/lib/resolveArticleForPage";
import ArticleModal from "@/components/ArticleModal";

// Intercepts client-side navigation to /article/[id] from anywhere already
// inside the app, rendering it as an overlay on top of whatever page linked
// here (see ArticleModal.jsx) instead of a full route transition — the
// underlying feed page never unmounts, so its scroll position is never
// lost in the first place; there's nothing to "restore". A direct load,
// hard refresh, or shared link still renders the real page at
// app/article/[id]/page.jsx, unaffected by any of this — that's the whole
// point of route interception (see Next's own docs on the pattern) rather
// than just building an always-on client-side reader overlay by hand.
//
// (.) — same segment level as the intercepted route: @modal is a slot, not
// a segment, so despite living one file-system level deeper than
// app/article, it's considered the same route-tree depth as app/ itself.
export default async function ArticleModalPage({ params }) {
  const { id } = await params;
  const { article, sanitizedContent, relatedCoverage, readingTime } = await resolveArticleForPage(id);

  return (
    <ArticleModal
      article={article}
      sanitizedContent={sanitizedContent}
      relatedCoverage={relatedCoverage}
      readingTime={readingTime}
    />
  );
}
