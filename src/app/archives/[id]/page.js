import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { notFound } from "next/navigation";
import NewsCard from "@/components/NewsCard"; // optional if you want to display styled cards

export default async function ArchiveDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const db = await initializeDbAndModels();

  const archive = await db.Archive.findOne({
    where: {
      id: Number(params.id),
      userId: session.user.id,
    },
    include: [{ model: db.SavedArticle }],
  });

  if (!archive) return notFound();

  return (
    <div style={{ padding: "20px" }}>
      <h1>{archive.name}</h1>
      {archive.SavedArticles.length === 0 ? (
        <p>No saved articles yet.</p>
      ) : (
        <div>
          {archive.SavedArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
