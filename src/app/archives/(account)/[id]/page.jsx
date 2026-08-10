import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { notFound } from "next/navigation";
import { Bookmark } from "lucide-react";
import NewsGridWrapper from "@/components/NewsGridWrapper";
import NewsCardThree from "@/components/NewsCardThree";
import ArchiveVisibilityToggle from "@/components/ArchiveVisibilityToggle";
import styles from "./page.module.scss";

export default async function ArchiveDetailPage({ params }) {
  const session = await auth();
  if (!session) return notFound();

  // `params` is a Promise in this Next.js version (see article/[id]/page.jsx
  // and archives/shared/[slug]/page.jsx for the same pattern) — reading
  // `params?.id` synchronously always returned undefined, so `Number(...)`
  // was always NaN and this page 404'd for every real archive.
  const { id } = await params;
  const db = await initializeDbAndModels();

  const archive = await db.Archive.findOne({
    where: {
      id: Number(id),
      userId: session.user.id,
    },
    include: [{ model: db.SavedArticle }],
  });

  if (!archive) return notFound();

  const articles = archive.SavedArticles.map((article) => article.toJSON());
  const isSubscribed = session.user.tier !== "Free";

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={`${styles.title} headline`}>
          <Bookmark size={24} strokeWidth={2} />
          {archive.name}
        </h1>
        {isSubscribed && (
          <ArchiveVisibilityToggle
            archiveId={archive.id}
            initialIsPublic={archive.isPublic}
            initialSlug={archive.publicSlug}
          />
        )}
      </div>

      {articles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No articles have been added to this Archive.</p>
        </div>
      ) : (
        <>
          <NewsGridWrapper>
            {articles.map((article) => (
              <NewsCardThree
                key={article.id}
                article={article}
                archiveId={archive.id}
                viewOnly={false}
              />
            ))}
          </NewsGridWrapper>
          <p className={styles.disclaimer}>
            Links to some saved articles might break. This could be caused by
            the publisher removing the article from their website or setting
            the article to private.
          </p>
        </>
      )}
    </div>
  );
}
