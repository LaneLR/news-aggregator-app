// app/api/archives/[archiveId]/articles/[articleId]/route.js
import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );

    const db = await initializeDbAndModels();
    const { SavedArticle } = db;

    const archiveId = Number(params.archiveId);
    const articleId = Number(params.articleId);

    if (!archiveId || !articleId || isNaN(archiveId) || isNaN(articleId)) {
      return NextResponse.json(
        { error: "Invalid archive or article ID" },
        { status: 400 }
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
