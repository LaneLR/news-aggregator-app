import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { notFound } from "next/navigation";
import NewsGridWrapper from "@/components/Pages/NewsGridWrapper";
import NewsCardThree from "@/components/NewsCardThree";

export default async function ArchiveDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const db = await initializeDbAndModels();

  const archive = await db.Archive.findOne({
    where: {
      id: Number(params?.id),
      userId: session.user.id,
    },
    include: [{ model: db.SavedArticle }],
  });

  if (!archive) return notFound();

  const articles = archive.SavedArticles.map((article) => article.toJSON());

  return (
    <div style={{ padding: "20px", color: "var(--dark-blue)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>{archive.name}</h1>
        <div />
      </div>
      {articles.length === 0 ? (
        <div
          style={{
            display: "flex",
            padding: "20px 0 0 0",
            justifyContent: "center",
            alignContent: "center",
            width: "100%",
            textAlign: "center",
          }}
        >
          <p>No articles have been added to this Archive.</p>
        </div>
      ) : articles.length === 0 ? (
        <div
          style={{
            display: "flex",
            padding: "20px 0 0 0",
            justifyContent: "center",
            alignContent: "center",
            width: "100%",
            textAlign: "center",
          }}
        >
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
          <div
            style={{
              padding: "0 20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              bottom: "0",
              left: "0",
            }}
          >
            <p>
              <i>
                Links to some saved articles might break. This could be caused
                by the publisher removing the article from their website or
                setting the article to private.
              </i>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
