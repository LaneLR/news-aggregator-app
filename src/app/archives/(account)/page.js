// app/archives/page.jsx
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { Bookmark } from "lucide-react";
import ArchivesGrid from "@/components/ArchivesGrid";
import { redirect } from "next/navigation";
import styles from "./page.module.scss";

export const metadata = {
  title: "My Archives",
  robots: { index: false, follow: false },
};

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

      <ArchivesGrid archives={plainArchives} />
    </>
  );
}
