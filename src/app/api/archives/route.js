import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req, { params }) {
  const archiveIdStr = params?.archiveId;
  if (!archiveIdStr || archiveIdStr === "undefined") {
    return NextResponse.json({ saved: false }, { status: 400 });
  }

  const archiveId = Number(archiveIdStr);   // or keep as string if UUID
  if (isNaN(archiveId)) {
    return NextResponse.json({ saved: false }, { status: 400 });
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const db = await initializeDbAndModels();
    const { Archive } = db;

    const archives = await Archive.findAll({
      where: { userId: session.user.id },
      order: [["createdAt", "DESC"]],
    });

    return NextResponse.json(archives);
  } catch (err) {
    console.error("GET /api/archives error:", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { name } = await req.json();
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Archive must have a name" },
        { status: 400 }
      );
    }

    const db = await initializeDbAndModels();
    const { Archive } = db;

    const newArchive = await Archive.create({
      name: name.trim(),
      userId: session.user.id,
    });

    return NextResponse.json(newArchive, { status: 201 });
  } catch (err) {
    console.error("POST /api/archives error:", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
