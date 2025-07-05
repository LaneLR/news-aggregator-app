import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import initializeDbAndModels from "@/lib/db.mjs";
import { authRateLimitMiddleware } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let db;
  try {
    await authRateLimitMiddleware(req, NextResponse);

    db = await initializeDbAndModels();
    const User = db.User;

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_TOKEN_SECRET is not defined in environment variables!"
      );
      return NextResponse.json(
        { error: "Server configuration error: JWT secret missing" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, tier: user.tier },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { password: _, ...userWithoutPassword } = user.toJSON();

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: userWithoutPassword,
      },
      { status: 200 }
    );

    response.cookies.set("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1, // 1 hour
      path: "/",
    });

    return response;
  } catch (err) {
    if (err && err.status === 429) {
      console.warn(
        "Rate limit exceeded for login attempt from IP:",
        req.ip || req.headers["x-forwarded-for"]
      );
      return NextResponse.json(
        { error: "Too many login attempts. Please try again after some time." },
        { status: 429 }
      );
    }

    console.error("Error in /api/login POST request:", err);

    if (err.name === "SequelizeValidationError") {
      const errors = err.errors
        ? err.errors.map((e) => e.message)
        : ["Validation error"];
      return NextResponse.json(
        { error: "Login validation failed", details: errors },
        { status: 400 }
      );
    } else if (
      err.message &&
      (err.message.includes("Database URL is missing.") ||
        err.message.includes(
          "Unable to connect to the database or initialize Sequelize:"
        ))
    ) {
      return NextResponse.json(
        {
          error: "Database connection or initialization failed.",
          details: err.message,
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "Internal server error during login", details: err.message },
        { status: 500 }
      );
    }
  }
}
