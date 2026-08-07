// src/app/api/articles/check/route.js
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

export async function GET(req) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ saved: false }, { status: 401 });

  const url = new URL(req.url).searchParams.get("url");
  if (!url)
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });

  const db = await initializeDbAndModels();
  const saved = await db.SavedArticle.findOne({
    where: { url },
    include: [
      {
        model: db.Archive,
        where: { userId: session.user.id },
        required: true,
        attributes: [],
      },
    ],
  });

  if (saved) {
    return NextResponse.json({ saved: true, archiveId: saved.archiveId });
  }

  return NextResponse.json({ saved: false });
}
