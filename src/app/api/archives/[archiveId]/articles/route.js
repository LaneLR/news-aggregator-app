import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(_req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveId = Number(params.archiveId);
  if (isNaN(archiveId))
    return NextResponse.json({ error: "Invalid archive ID" }, { status: 400 });

  const db = await initializeDbAndModels();
  const { SavedArticle } = db;

  const articles = await SavedArticle.findAll({
    where: { archiveId },
    order: [["createdAt", "DESC"]],
  });

  return NextResponse.json(articles.map((a) => a.toJSON()));
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveId = Number(params.archiveId);
  if (isNaN(archiveId))
    return NextResponse.json({ error: "Invalid archive ID" }, { status: 400 });

  const { title, url, urlToImage, source, sourceName } = await req.json();
  if (!url || !title)
    return NextResponse.json(
      { error: "Missing url or title" },
      { status: 400 }
    );

  const db = await initializeDbAndModels();
  const { SavedArticle } = db;

  const existing = await SavedArticle.findOne({ where: { archiveId, url } });
  if (existing) {
    return NextResponse.json(
      { message: "Already saved", saved: true },
      { status: 200 }
    );
  }

  const newArticle = await SavedArticle.create({
    title,
    url,
    urlToImage,
    sourceName: sourceName || source?.name || "Unknown source",
    archiveId,
  });

  return NextResponse.json(
    { message: "Article saved", saved: true, article: newArticle.toJSON() },
    { status: 201 }
  );
}
