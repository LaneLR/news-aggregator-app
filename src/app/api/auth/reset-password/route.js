import jwt from "jsonwebtoken";
import initializeDbAndModels from "@/lib/db";
import { authRateLimitMiddleware } from "@/lib/rate-limiter";

export async function POST(req) {
  const db = await initializeDbAndModels();
  const { User } = db;
  try {
    await authRateLimitMiddleware(req);

    const { token, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

    if (decoded.purpose !== "reset-password") {
      return Response.json({ error: "Invalid or expired token." }, { status: 400 });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (decoded.v !== user.tokenVersion) {
      return Response.json(
        { error: "This reset link has already been used or is no longer valid." },
        { status: 400 }
      );
    }

    user.password = newPassword;
    // Invalidate this (and any other outstanding) reset link immediately.
    user.tokenVersion += 1;

    await user.save();

    return Response.json({
      message: "Password has been updated successfully.",
    });
  } catch (err) {
    console.error(err);
    if (err.status === 429) {
      return Response.json({ error: err.message }, { status: 429 });
    }
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return Response.json(
        { error: "Invalid or expired token." },
        { status: 400 }
      );
    }
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
