import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { nanoid } from "nanoid";

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.tier === "Free") {
    return NextResponse.json(
      { error: "This feature is for subscribers only." },
      { status: 403 }
    );
  }

  try {
    const { archiveId } = await params;
    const { isPublic } = await req.json();
    if (typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic must be a boolean." }, { status: 400 });
    }

    const { Archive } = await initializeDbAndModels();
    const archive = await Archive.findOne({
      where: { id: Number(archiveId), userId: session.user.id },
    });
    if (!archive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }

    const updateFields = { isPublic };
    if (isPublic && !archive.publicSlug) {
      updateFields.publicSlug = nanoid(12);
    }

    await archive.update(updateFields);

    return NextResponse.json({
      isPublic: archive.isPublic,
      publicSlug: archive.publicSlug,
    });
  } catch (err) {
    console.error("Error updating archive visibility:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
