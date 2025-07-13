import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const archiveId = parseInt(params.archiveId, 10);
    const db = await initializeDbAndModels();
    const { SavedArticle } = db;

    const articles = await SavedArticle.findAll({ where: { archiveId } });
    return NextResponse.json(articles);
  } catch (err) {
    console.error("GET /api/archives/[id]/articles error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const archiveId = parseInt(params.archiveId, 10);

    if (!archiveId || isNaN(archiveId)) {
      return NextResponse.json(
        { message: "Invalid archive ID" },
        { status: 400 }
      );
    }

    const { title, url, urlToImage, source } = body;

    const db = await initializeDbAndModels();
    const { SavedArticle } = db;

    const newArticle = await SavedArticle.create({
      title,
      url,
      urlToImage,
      sourceName: source?.name || "Unknown Source", 
      archiveId,
    });

    return NextResponse.json({ message: "Article saved", article: newArticle });
  } catch (err) {
    console.error("POST /api/archives/[id]/articles error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
