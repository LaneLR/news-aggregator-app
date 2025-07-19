import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(_, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await initializeDbAndModels();
  const deleted = await db.Archive.destroy({
    where: {
      id: Number(params.archiveId),
      userId: session.user.id,
    },
  });

  return deleted > 0
    ? NextResponse.json({ message: "Archive deleted" })
    : NextResponse.json({ error: "Archive not found" }, { status: 404 });
}
