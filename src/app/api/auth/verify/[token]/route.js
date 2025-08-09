import jwt from "jsonwebtoken";
import User from "@/lib/models/User";

export async function GET(req, { params }) {
  try {
    const { token } = params;
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    user.isVerified = true;
    await user.save();

    return Response.json({ message: "Account verified" });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  }
}
