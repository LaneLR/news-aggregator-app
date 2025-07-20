// app/archives/page.jsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import Link from "next/link";
import CreateArchiveClient from "@/components/CreateArchiveClient";
import DeleteArchiveButton from "@/components/DeleteArchiveButton";

export default async function ArchivesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <p>You must be logged in to view this page.</p>;
  }

  const db = await initializeDbAndModels();
  const { Archive } = db;
  const archives = await Archive.findAll({
    where: { userId: session.user.id },
    order: [["createdAt", "DESC"]],
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Archives</h2>

      <CreateArchiveClient />

      <ul style={{ marginTop: "1rem" }}>
        {archives.map((archive) => (
          <li key={archive.id} style={{ marginBottom: "0.5rem" }}>
            <Link href={`/archives/${archive.id}`}>
              <u>{archive.name}</u>
            </Link>
            {archive.name !== "Saved for later" && (
              <DeleteArchiveButton archiveId={archive.id} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
