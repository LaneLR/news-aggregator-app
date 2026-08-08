import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

const ALLOWED_VIEW_DENSITIES = ["card", "list", "magazine", "reader"];

// Not surfaced in the JWT/session (same reasoning as mutedKeywords/
// preferredCategories/keyboardShortcuts) — fetched directly by whichever
// component needs it instead of bloating every request's session payload.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ viewDensity: "card" }, { status: 200 });
  }

  try {
    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id, {
      attributes: ["viewDensity"],
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ viewDensity: user.viewDensity });
  } catch (err) {
    console.error("Error fetching layout prefs:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { viewDensity } = await req.json();

    if (!ALLOWED_VIEW_DENSITIES.includes(viewDensity)) {
      return NextResponse.json({ error: "Invalid viewDensity." }, { status: 400 });
    }

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update({ viewDensity });

    return NextResponse.json({ success: true, viewDensity });
  } catch (err) {
    console.error("Error updating layout prefs:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
