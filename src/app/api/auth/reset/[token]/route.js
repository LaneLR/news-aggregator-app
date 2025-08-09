import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "@/lib/models/User";

export async function POST(req, { params }) {
  try {
    const { token } = params;
    const { newPassword } = await req.json();
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return Response.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }
}
