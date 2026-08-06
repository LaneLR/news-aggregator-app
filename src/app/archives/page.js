// app/archives/page.jsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import DeleteArchiveButton from "@/components/DeleteArchiveButton";
import ArchiveCard from "@/components/ArchiveCard";
import NewsGridWrapper from "@/components/NewsGridWrapper";
import { redirect } from "next/navigation";
import CreateNewArchiveCard from "@/components/CreateNewArchiveCard";

export default async function ArchivesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect("/login");
  }

  const db = await initializeDbAndModels();
  const { Archive, SavedArticle } = db;
  const archives = await Archive.findAll({
    where: { userId: session.user.id },
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: SavedArticle,
        attributes: ["urlToImage", "createdAt"],
      },
    ],
  });

  const plainArchives = archives.map((a) => {
    const savedArticles = a.SavedArticles || [];
    const lastUpdated = savedArticles.length
      ? new Date(
          Math.max(...savedArticles.map((s) => new Date(s.createdAt).getTime()))
        )
      : a.createdAt;

    return {
      id: a.id,
      name: a.name,
      articleCount: savedArticles.length,
      lastUpdated: new Date(lastUpdated).toLocaleDateString(),
      articleImages: savedArticles
        .map((s) => s.urlToImage)
        .filter(Boolean)
        .slice(0, 4),
    };
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Archives</h2>
      <NewsGridWrapper>
        <CreateNewArchiveCard />
        {plainArchives.map((archive) => (
          <ArchiveCard archive={archive} key={archive.id}>
            {archive.name !== "Saved for later" && (
              <DeleteArchiveButton archiveId={archive.id} />
            )}
          </ArchiveCard>
        ))}
      </NewsGridWrapper>
    </div>
  );
}
