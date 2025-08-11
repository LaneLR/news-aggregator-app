import jwt from "jsonwebtoken";
import initializeDbAndModels from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    // 1. Properly await the database initialization to get the models.
    const { User } = await initializeDbAndModels();

    // 2. Access the 'token' from the 'params' object.
    const { token } = params;

    // 3. Verify the token.
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

    // 4. Find the user by primary key (ID).
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.isVerified = true;
    await user.save();

    return NextResponse.redirect(new URL("/verification/verify-success", req.url));
  } catch (err) {
    console.error(err);
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
