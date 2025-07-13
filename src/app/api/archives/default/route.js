import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await initializeDbAndModels();
    const archive = await db.Archive.findOne({
      where: {
        userId: session.user.id,
        name: "Saved for later", 
      },
    });

    if (!archive) {
      return NextResponse.json({ error: "Default archive not found" }, { status: 404 });
    }

    return NextResponse.json({ archiveId: archive.id });
  } catch (err) {
    console.error("Error getting default archive:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
