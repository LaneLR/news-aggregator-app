import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req, context) {
  const { params } = context;
  const archiveId = Number(params.archiveId); // Convert to number

  if (isNaN(archiveId)) {
    return NextResponse.json({ error: "Invalid archive ID" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ saved: false }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const articleUrl = decodeURIComponent(searchParams.get("url") || "");

    if (!articleUrl) {
      return NextResponse.json({ saved: false }, { status: 400 });
    }

    const db = await initializeDbAndModels();
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
