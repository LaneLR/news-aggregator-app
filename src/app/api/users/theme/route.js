import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

// A list of themes you'll offer. This prevents users from saving invalid data.
// Must match the themes actually defined in src/styles/themes.scss — a name
// accepted here with no matching CSS block would leave every --theme-* custom
// property unset for that user (the whole site silently loses its styling).
const ALLOWED_THEMES = ['default', 'dark'];

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { themeName } = await req.json();

    // null is a valid, deliberate value here too — it means "follow the
    // system theme" (see themes.scss), not "invalid."
    if (themeName !== null && !ALLOWED_THEMES.includes(themeName)) {
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