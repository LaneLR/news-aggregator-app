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
    const { followedKeywords } = await req.json();

    if (!Array.isArray(followedKeywords)) {
      return NextResponse.json(
        { error: "followedKeywords must be an array." },
        { status: 400 }
      );
    }

    const cleaned = Array.from(
      new Set(
        followedKeywords
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

    await user.update({ followedKeywords: cleaned });

    return NextResponse.json({ success: true, followedKeywords: cleaned });
  } catch (err) {
    console.error("Error updating followed keywords:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
