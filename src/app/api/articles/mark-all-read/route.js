import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";

// Bulk version of the per-click ReadArticle insert in /api/articles/click —
// takes whatever's currently loaded on the page (one category, one search
// result set, etc.) and marks all of it read in one round trip instead of
// requiring a click per article.
export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls is required" }, { status: 400 });
    }

    const { ReadArticle } = await initializeDbAndModels();
    await ReadArticle.bulkCreate(
      urls.map((articleUrl) => ({ userId: session.user.id, articleUrl })),
      { ignoreDuplicates: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error marking articles as read:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
