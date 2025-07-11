// app/archives/page.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import Link from "next/link";

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
      <ul>
        {archives.map((archive) => (
          <li key={archive.id}>
            <Link href={`/archives/${archive.id}`}>
              <u>{archive.name}</u>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
