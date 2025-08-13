import jwt from "jsonwebtoken";
import User from "@/lib/models/User";
import initializeDbAndModels from "@/lib/db";

export async function POST(req) {
  const db = await initializeDbAndModels();
  const { User } = db;
  try {
    const { token, newPassword } = await req.json();

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    user.password = newPassword;

    await user.save();

    return Response.json({
      message: "Password has been updated successfully.",
    });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return Response.json(
        { error: "Invalid or expired token." },
        { status: 400 }
      );
    }
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
