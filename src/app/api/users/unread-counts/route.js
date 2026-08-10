import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { getUnreadCounts } from "@/lib/unreadCounts";

const EMPTY = { categories: {}, feeds: 0, following: 0 };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(EMPTY);
  }

  try {
    const db = await initializeDbAndModels();
    const user = await db.User.findByPk(session.user.id, {
      attributes: ["id", "mutedKeywords", "followedKeywords"],
    });
    if (!user) return NextResponse.json(EMPTY);

    const isSubscribed = session.user.tier && session.user.tier !== "Free";
    const counts = await getUnreadCounts(db, user, { isSubscribed });
    return NextResponse.json(counts);
  } catch (err) {
    console.error("Error computing unread counts:", err);
    return NextResponse.json(EMPTY, { status: 500 });
  }
}
