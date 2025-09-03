import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";

export async function GET(req) {
  const session = await getServerSession(authOptions);
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
    const { Feed } = await initializeDbAndModels();
    const feeds = await Feed.findAll({
      where: { userId: session.user.id },
      order: [["createdAt", "ASC"]],
    });
    return NextResponse.json(feeds);
  } catch (err) {
    console.error("Error fetching feeds:", err);
    return NextResponse.json(
      { error: "Could not fetch feeds" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
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
    const { title, sourceNames, categories } = await req.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Feed title is required" },
        { status: 400 }
      );
    }

    const { Feed } = await initializeDbAndModels();
    const newFeed = await Feed.create({
      title,
      sourceNames: sourceNames || [],
      categories: categories || [],
      userId: session.user.id,
    });

    return NextResponse.json(newFeed, { status: 201 });
  } catch (err) {
    console.error("Error creating feed:", err);
    return NextResponse.json(
      { error: "Could not create feed" },
      { status: 500 }
    );
  }
}
