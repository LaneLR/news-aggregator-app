import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { ALL_SECTION_KEYS } from "@/lib/homeSections";
import { GATED_TAGS } from "@/lib/subscriberOnlyCategories";

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { homeSections } = await req.json();

    if (!Array.isArray(homeSections)) {
      return NextResponse.json(
        { error: "homeSections must be an array." },
        { status: 400 }
      );
    }

    const isSubscribed = session.user.tier && session.user.tier !== "Free";
    const allowedKeys = new Set(ALL_SECTION_KEYS);
    // Silently drops anything not in ALL_SECTION_KEYS and, for non-subscribers,
    // any gated category tag they don't actually have access to — a request
    // crafted directly against this endpoint can't smuggle Market/Finance/
    // Journal into a free account's homepage this way.
    const cleaned = Array.from(new Set(homeSections)).filter((key) => {
      if (!allowedKeys.has(key)) return false;
      if (!isSubscribed && GATED_TAGS.includes(key)) return false;
      return true;
    });

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update({ homeSections: cleaned });

    return NextResponse.json({ success: true, homeSections: cleaned });
  } catch (err) {
    console.error("Error updating home sections:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
