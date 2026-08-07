import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

const MAX_KEYWORDS = 25;
const MAX_KEYWORD_LENGTH = 40;

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mutedKeywords } = await req.json();

    if (!Array.isArray(mutedKeywords)) {
      return NextResponse.json(
        { error: "mutedKeywords must be an array." },
        { status: 400 }
      );
    }

    const cleaned = Array.from(
      new Set(
        mutedKeywords
          .map((k) => (typeof k === "string" ? k.trim() : ""))
          .filter(Boolean)
          .map((k) => k.slice(0, MAX_KEYWORD_LENGTH))
      )
    ).slice(0, MAX_KEYWORDS);

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update({ mutedKeywords: cleaned });

    return NextResponse.json({ success: true, mutedKeywords: cleaned });
  } catch (err) {
    console.error("Error updating keyword filters:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
