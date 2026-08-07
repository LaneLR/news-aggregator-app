import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

const ALLOWED_FREQUENCIES = ["daily", "weekly"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { User } = await initializeDbAndModels();
  const user = await User.findByPk(session.user.id, {
    attributes: ["digestEnabled", "digestFrequency", "digestFeedId"],
  });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    digestEnabled: user.digestEnabled,
    digestFrequency: user.digestFrequency,
    digestFeedId: user.digestFeedId,
  });
}

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { digestEnabled, digestFrequency, digestFeedId } = await req.json();

    const { User, Feed } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateFields = {};
    if (typeof digestEnabled === "boolean") {
      updateFields.digestEnabled = digestEnabled;
    }
    if (digestFrequency !== undefined) {
      if (!ALLOWED_FREQUENCIES.includes(digestFrequency)) {
        return NextResponse.json(
          { error: "Invalid digest frequency." },
          { status: 400 }
        );
      }
      updateFields.digestFrequency = digestFrequency;
    }
    if (digestFeedId !== undefined) {
      if (digestFeedId === null) {
        updateFields.digestFeedId = null;
      } else {
        const feed = await Feed.findOne({
          where: { id: digestFeedId, userId: session.user.id },
        });
        if (!feed) {
          return NextResponse.json({ error: "Feed not found." }, { status: 404 });
        }
        updateFields.digestFeedId = feed.id;
      }
    }

    await user.update(updateFields);

    return NextResponse.json({
      success: true,
      digestEnabled: user.digestEnabled,
      digestFrequency: user.digestFrequency,
      digestFeedId: user.digestFeedId,
    });
  } catch (err) {
    console.error("Error updating digest preferences:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
