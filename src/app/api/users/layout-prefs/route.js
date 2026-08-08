import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

const ALLOWED_VIEW_DENSITIES = ["card", "list", "magazine"];
const MAX_ORDER_ENTRIES = 30;
const MAX_ENTRY_LENGTH = 60;

function cleanOrderArray(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((v) => typeof v === "string" && v.length > 0)
    .slice(0, MAX_ORDER_ENTRIES)
    .map((v) => v.slice(0, MAX_ENTRY_LENGTH));
}

// Not surfaced in the JWT/session (same reasoning as mutedKeywords/
// preferredCategories/keyboardShortcuts) — fetched directly by whichever
// component needs it instead of bloating every request's session payload.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { categoryOrder: [], headerIconOrder: [], viewDensity: "card" },
      { status: 200 }
    );
  }

  try {
    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id, {
      attributes: ["categoryOrder", "headerIconOrder", "viewDensity"],
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      categoryOrder: user.categoryOrder,
      headerIconOrder: user.headerIconOrder,
      viewDensity: user.viewDensity,
    });
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
    const body = await req.json();
    const updates = {};

    if ("categoryOrder" in body) {
      const cleaned = cleanOrderArray(body.categoryOrder);
      if (cleaned === null) {
        return NextResponse.json({ error: "categoryOrder must be an array." }, { status: 400 });
      }
      updates.categoryOrder = cleaned;
    }

    if ("headerIconOrder" in body) {
      const cleaned = cleanOrderArray(body.headerIconOrder);
      if (cleaned === null) {
        return NextResponse.json({ error: "headerIconOrder must be an array." }, { status: 400 });
      }
      updates.headerIconOrder = cleaned;
    }

    if ("viewDensity" in body) {
      if (!ALLOWED_VIEW_DENSITIES.includes(body.viewDensity)) {
        return NextResponse.json({ error: "Invalid viewDensity." }, { status: 400 });
      }
      updates.viewDensity = body.viewDensity;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update(updates);

    return NextResponse.json({ success: true, ...updates });
  } catch (err) {
    console.error("Error updating layout prefs:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
