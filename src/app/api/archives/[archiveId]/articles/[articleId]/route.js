// app/api/archives/[archiveId]/articles/[articleId]/route.js
import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );

    const db = await initializeDbAndModels();
    const { SavedArticle, Archive } = db;

    // params is a Promise in Next 16 App Router — must be awaited, otherwise
    // both IDs are always undefined and every delete 400s (real bug fixed
    // here; see archives/[archiveId]/route.js for the same pattern).
    const { archiveId: rawArchiveId, articleId: rawArticleId } = await params;
    const archiveId = Number(rawArchiveId);
    const articleId = Number(rawArticleId);

    if (!archiveId || !articleId || isNaN(archiveId) || isNaN(articleId)) {
      return NextResponse.json(
        { error: "Invalid archive or article ID" },
        { status: 400 }
      );
    }

    const archive = await Archive.findOne({
      where: { id: archiveId, userId: session.user.id },
    });
    if (!archive) {
      return NextResponse.json(
        { error: "Archive not found" },
        { status: 404 }
      );
    }

    const deletedCount = await SavedArticle.destroy({
      where: {
        id: articleId,
        archiveId,
      },
    });

    if (deletedCount === 0) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
