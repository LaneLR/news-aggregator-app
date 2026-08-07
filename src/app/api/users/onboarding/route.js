import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { GATED_TAGS } from "@/lib/subscriberOnlyCategories";

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { preferredCategories, preferredSources } = await req.json();
    const isSubscribed = session.user.tier && session.user.tier !== "Free";

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Journals/Market/Finance are subscriber-only — the onboarding UI already
    // hides these for non-subscribers, but this is the actual persistence
    // layer, so it can't just trust whatever the client sends.
    const sanitizedCategories = Array.isArray(preferredCategories)
      ? preferredCategories.filter((c) => isSubscribed || !GATED_TAGS.includes(c))
      : [];

    await user.update({
      preferredCategories: sanitizedCategories,
      preferredSources: Array.isArray(preferredSources) ? preferredSources : [],
      onboardingCompleted: true,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error saving onboarding preferences:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
