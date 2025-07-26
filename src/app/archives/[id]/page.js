import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { notFound } from "next/navigation";
import NewsCard from "@/components/NewsCard"; // optional if you want to display styled cards
import NewsGridWrapper from "@/components/NewsGridWrapper";
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
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center',}}>
        <h1>{archive.name} </h1> {" "}
        <p><i>Links to some saved articles might break. This could be because the publisher has removed the article from their website or set the article to private.</i></p>
        <div />
      </div>
      {articles.length === 0 ? (
        <p>No saved articles yet.</p>
      ) : (
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
      )}
    </div>
  );
}
