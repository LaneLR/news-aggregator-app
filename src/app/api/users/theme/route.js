import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";

// A list of themes you'll offer. This prevents users from saving invalid data.
const ALLOWED_THEMES = ['default', 'dark', 'forest'];

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Security Check: Only allow non-free users to change their theme
  if (session.user.tier === 'Free') {
    return NextResponse.json({ error: "Theme customization is a Pro feature." }, { status: 403 });
  }

  try {
    const { themeName } = await req.json();

    // Validate the incoming theme name
    if (!ALLOWED_THEMES.includes(themeName)) {
      return NextResponse.json({ error: "Invalid theme name." }, { status: 400 });
    }

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update({ selectedTheme: themeName });

    return NextResponse.json({ success: true, message: "Theme updated successfully." });
  } catch (err) {
    console.error("Error updating theme:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}