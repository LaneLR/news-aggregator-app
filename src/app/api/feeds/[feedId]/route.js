import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";

const checkSubscription = (session) => {
  return session.user.tier === "Free";
};

export async function PATCH(req, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (checkSubscription(session))
    return NextResponse.json(
      { error: "This feature is for subscribers only." },
      { status: 403 }
    );

  try {
    const { feedId } = context.params;
    const { title, sourceNames, categories } = await req.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Feed title is required" },
        { status: 400 }
      );
    }

    const { Feed } = await initializeDbAndModels();

    const feed = await Feed.findOne({
      where: { id: feedId, userId: session.user.id },
    });

    if (!feed) {
      return NextResponse.json(
        { error: "Feed not found or access denied" },
        { status: 404 }
      );
    }

    const updatedFeed = await feed.update({
      title,
      sourceNames: sourceNames || [],
      categories: categories || [],
    });

    return NextResponse.json(updatedFeed);
  } catch (err) {
    console.error("Error updating feed:", err);
    return NextResponse.json(
      { error: "Could not update feed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (checkSubscription(session))
    return NextResponse.json(
      { error: "This feature is for subscribers only." },
      { status: 403 }
    );

  try {
    const { feedId } = context.params;
    const { Feed } = await initializeDbAndModels();

    const feed = await Feed.findOne({
      where: { id: feedId, userId: session.user.id },
    });

    if (!feed) {
      return NextResponse.json(
        { error: "Feed not found or access denied" },
        { status: 404 }
      );
    }

    await feed.destroy();

    return NextResponse.json(
      { message: "Feed deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting feed:", err);
    return NextResponse.json(
      { error: "Could not delete feed" },
      { status: 500 }
    );
  }
}
