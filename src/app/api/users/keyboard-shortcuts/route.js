import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { DEFAULT_KEYBOARD_SHORTCUTS, SHORTCUT_ACTIONS } from "@/lib/keyboardShortcuts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { User } = await initializeDbAndModels();
  const user = await User.findByPk(session.user.id, {
    attributes: ["keyboardShortcuts"],
  });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    keyboardShortcuts: user.keyboardShortcuts || DEFAULT_KEYBOARD_SHORTCUTS,
  });
}

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { keyboardShortcuts } = await req.json();

    if (!keyboardShortcuts || typeof keyboardShortcuts !== "object") {
      return NextResponse.json({ error: "Invalid shortcuts." }, { status: 400 });
    }

    // Every action must be bound to exactly one single-character key, and no
    // two actions can share a key — reject silently-broken configs rather
    // than partially saving them.
    const values = SHORTCUT_ACTIONS.map((action) => keyboardShortcuts[action]);
    const allValid = values.every(
      (value) => typeof value === "string" && value.length === 1
    );
    if (!allValid) {
      return NextResponse.json(
        { error: "Every shortcut must be a single key." },
        { status: 400 }
      );
    }
    if (new Set(values).size !== values.length) {
      return NextResponse.json(
        { error: "Shortcuts can't share the same key." },
        { status: 400 }
      );
    }

    const sanitized = Object.fromEntries(
      SHORTCUT_ACTIONS.map((action) => [action, keyboardShortcuts[action]])
    );

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update({ keyboardShortcuts: sanitized });

    return NextResponse.json({ success: true, keyboardShortcuts: sanitized });
  } catch (err) {
    console.error("Error updating keyboard shortcuts:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
