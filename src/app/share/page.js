import Link from "next/link";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { CheckCircle2, LogIn, Bookmark } from "lucide-react";
import styles from "./page.module.scss";

export const metadata = {
  title: "Save Shared Article",
  robots: { index: false, follow: false },
};

// Some apps put the shared link in `text` instead of (or alongside) `url` —
// the Web Share Target spec doesn't guarantee which field a link ends up
// in, so this falls back to pulling the first URL-shaped token out of text.
function extractUrl(text) {
  if (!text) return null;
  const match = text.match(/https?:\/\/\S+/);
  return match ? match[0] : null;
}

export default async function SharePage({ searchParams }) {
  const params = await searchParams;
  const sharedUrl = params?.url || extractUrl(params?.text);
  const sharedTitle = params?.title?.trim() || sharedUrl || "Shared article";

  const session = await auth();

  if (!session) {
    const returnTo = `/share?${new URLSearchParams({
      url: sharedUrl || "",
      title: sharedTitle,
    }).toString()}`;
    return (
      <div className={styles.wrapper}>
        <LogIn size={32} strokeWidth={1.5} />
        <h1 className="headline">Sign in to save this article</h1>
        <p className={styles.hint}>
          Sign in to MorningFeeds and we&apos;ll save it to your Archives.
        </p>
        <Link href={`/login?callbackUrl=${encodeURIComponent(returnTo)}`} className={styles.primaryLink}>
          Sign In
        </Link>
      </div>
    );
  }

  if (!sharedUrl) {
    return (
      <div className={styles.wrapper}>
        <Bookmark size={32} strokeWidth={1.5} />
        <h1 className="headline">Nothing to save</h1>
        <p className={styles.hint}>
          That share didn&apos;t include a link MorningFeeds could find. Try sharing directly from
          the article&apos;s share button instead.
        </p>
        <Link href="/news" className={styles.primaryLink}>
          Back to MorningFeeds
        </Link>
      </div>
    );
  }

  const { Archive, SavedArticle } = await initializeDbAndModels();
  const archive = await Archive.findOne({
    where: { userId: session.user.id, name: "Saved for later" },
  });

  if (archive) {
    const existing = await SavedArticle.findOne({ where: { archiveId: archive.id, url: sharedUrl } });
    if (!existing) {
      await SavedArticle.create({
        title: sharedTitle,
        url: sharedUrl,
        sourceName: "Shared",
        archiveId: archive.id,
      });
    }
  }

  return (
    <div className={styles.wrapper}>
      <CheckCircle2 size={32} strokeWidth={1.5} className={styles.successIcon} />
      <h1 className="headline">Saved to your Archives</h1>
      <p className={styles.hint}>{sharedTitle}</p>
      <Link href="/archives" className={styles.primaryLink}>
        View your Archives
      </Link>
    </div>
  );
}
