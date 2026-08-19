import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import ArticleFallbackArt from "./ArticleFallbackArt";
import { getCategoryColor } from "@/lib/categoryColors";
import styles from "./PremiumTeaserCard.module.scss";

// Renders a locked preview of a MochaReads Pro-only article inside an
// otherwise-free feed (see categoryArticles.js's injectPremiumTeasers) —
// title/source/image are real (a specific enticing headline converts
// better than an abstract upsell), everything is visually blurred/locked,
// and the whole card links to /pricing rather than the article itself or
// an /article/[id] reader page, since a Free viewer can't actually open it.
export default function PremiumTeaserCard({ article, density = "card" }) {
  const badgeCategory = Array.isArray(article.category) ? article.category[0] : null;
  const rawUrl = typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";
  const proxiedImageUrl = rawUrl ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}` : null;
  const sourceName = article.sourceName || "MochaReads Pro";

  return (
    <Link
      href="/pricing"
      className={`${styles.cardContainer} ${density === "list" ? styles.densityList : ""} ${
        density === "magazine" ? styles.densityMagazine : ""
      }`}
      style={badgeCategory ? { borderTopColor: getCategoryColor(badgeCategory), borderTopWidth: "4px" } : undefined}
      aria-label={`${article.title} — MochaReads Pro article, subscribe to read`}
    >
      <div className={styles.imageArea}>
        {proxiedImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- deliberately
          // blurred decorative background, not a real content image; skipping
          // next/image's srcset/priority machinery for a purely visual teaser.
          <img src={proxiedImageUrl} alt="" className={styles.blurredImage} />
        ) : (
          // No title passed — a titleless fallback is just a flat color
          // gradient with nothing to blur, so this renders plainly under
          // the same lock overlay rather than needing its own blur variant.
          <ArticleFallbackArt category={badgeCategory} />
        )}
        <div className={styles.lockOverlay}>
          <Lock size={22} strokeWidth={2} />
        </div>
      </div>
      <div className={styles.contentArea}>
        <p className={styles.proBadge}>
          <Sparkles size={12} strokeWidth={2.5} />
          MochaReads Pro
        </p>
        <h3 className={styles.blurredTitle}>{article.title}</h3>
        <p className={styles.sourceName}>{sourceName}</p>
      </div>
    </Link>
  );
}
