import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db.js";
import { authRateLimitMiddleware } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await authRateLimitMiddleware(req, NextResponse);

    const { email, password } = await req.json();

    // Basic manual validation
    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json(
        { error: "Must be a valid email." },
        { status: 400 }
      );
    if (password.length < 6)
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );

    const db = await initializeDbAndModels();
    const { User } = db;

    const newUser = await User.create({ email, password });

    await db.Archive.findOrCreate({
      where: {
        userId: newUser.id,
        name: "Saved for later",
      },
    });
    const { password: _pw, ...userWithoutPassword } = newUser.toJSON();

    return NextResponse.json(
      { message: "User registered successfully!", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in /api/register:", err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
