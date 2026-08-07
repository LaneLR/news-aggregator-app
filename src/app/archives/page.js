// app/archives/page.jsx
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { Bookmark } from "lucide-react";
import DeleteArchiveButton from "@/components/DeleteArchiveButton";
import ArchiveCard from "@/components/ArchiveCard";
import NewsGridWrapper from "@/components/NewsGridWrapper";
import { redirect } from "next/navigation";
import CreateNewArchiveCard from "@/components/CreateNewArchiveCard";
import styles from "./page.module.scss";

export default async function ArchivesPage() {
  const session = await auth();
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
    <>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <Bookmark size={26} strokeWidth={2} />
          Your Archives
        </h1>
        <p className={styles.pageSubtitle}>
          Articles you&apos;ve saved, organized into folders you control.
        </p>
      </div>

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
    </>
  );
}
