import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { preferredCategories, preferredSources } = await req.json();

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update({
      preferredCategories: Array.isArray(preferredCategories)
        ? preferredCategories
        : [],
      preferredSources: Array.isArray(preferredSources) ? preferredSources : [],
      onboardingCompleted: true,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error saving onboarding preferences:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
