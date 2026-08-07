import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await initializeDbAndModels();
  const archives = await db.Archive.findAll({
    where: { userId: session.user.id },
    order: [["createdAt", "DESC"]],
  });

  return NextResponse.json({ archives });
}

export async function POST(req) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const db = await initializeDbAndModels();
  const [archive, created] = await db.Archive.findOrCreate({
    where: {
      userId: session.user.id,
      name: name.trim(),
    },
  });

  return NextResponse.json({ archive });
}
