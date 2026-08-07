import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req, context) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ saved: false }, { status: 401 });

  const archiveId = Number(context.params.archiveId);
  if (isNaN(archiveId))
    return NextResponse.json({ saved: false }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const articleUrl = searchParams.get("url");

  if (!articleUrl)
    return NextResponse.json({ saved: false }, { status: 400 });

  try {
    const db = await initializeDbAndModels();

    const archive = await db.Archive.findOne({
      where: { id: archiveId, userId: session.user.id },
    });
    if (!archive) return NextResponse.json({ saved: false }, { status: 404 });

    const existing = await db.SavedArticle.findOne({
      where: {
        archiveId,
        url: articleUrl,
      },
    });

    return NextResponse.json({ saved: !!existing });
  } catch (err) {
    console.error("Check saved article error:", err);
    return NextResponse.json({ saved: false }, { status: 500 });
  }
}