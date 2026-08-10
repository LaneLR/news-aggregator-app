import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // params is a Promise in Next 16 App Router — must be awaited (real bug
  // fix: it was read synchronously before, so archiveId was always NaN).
  const { archiveId: rawArchiveId } = await params;
  const archiveId = Number(rawArchiveId);
  if (isNaN(archiveId))
    return NextResponse.json({ error: "Invalid archive ID" }, { status: 400 });

  const db = await initializeDbAndModels();
  const { SavedArticle, Archive } = db;

  const archive = await Archive.findOne({
    where: { id: archiveId, userId: session.user.id },
  });
  if (!archive)
    return NextResponse.json({ error: "Archive not found" }, { status: 404 });

  const articles = await SavedArticle.findAll({
    where: { archiveId },
    order: [["createdAt", "DESC"]],
  });

  return NextResponse.json(articles.map((a) => a.toJSON()));
}

export async function POST(req, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // params is a Promise in Next 16 App Router — must be awaited (see GET
  // above for the same fix).
  const { archiveId: rawArchiveId } = await params;
  const archiveId = Number(rawArchiveId);
  if (isNaN(archiveId))
    return NextResponse.json({ error: "Invalid archive ID" }, { status: 400 });

  const { title, url, urlToImage, source, sourceName } = await req.json();
  if (!url || !title)
    return NextResponse.json(
      { error: "Missing url or title" },
      { status: 400 }
    );

  const db = await initializeDbAndModels();
  const { SavedArticle, Archive } = db;

  const archive = await Archive.findOne({
    where: { id: archiveId, userId: session.user.id },
  });
  if (!archive)
    return NextResponse.json({ error: "Archive not found" }, { status: 404 });

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
