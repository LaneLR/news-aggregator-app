import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";

const ALLOWED_FREQUENCIES = ["daily", "weekly"];

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { digestEnabled, digestFrequency } = await req.json();

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

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update(updateFields);

    return NextResponse.json({
      success: true,
      digestEnabled: user.digestEnabled,
      digestFrequency: user.digestFrequency,
    });
  } catch (err) {
    console.error("Error updating digest preferences:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
