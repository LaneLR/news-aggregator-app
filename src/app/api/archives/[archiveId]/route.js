import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(_, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // params is a Promise in Next 16 App Router — it must be awaited before
  // property access, otherwise archiveId is always undefined and every
  // delete silently 404s (previously accessed synchronously, a real bug).
  const { archiveId } = await params;
  const db = await initializeDbAndModels();
  const deleted = await db.Archive.destroy({
    where: {
      id: Number(archiveId),
      userId: session.user.id,
    },
  });

  return deleted > 0
    ? NextResponse.json({ message: "Archive deleted" })
    : NextResponse.json({ error: "Archive not found" }, { status: 404 });
}
