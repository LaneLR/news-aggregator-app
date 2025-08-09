import jwt from "jsonwebtoken";
import User from "@/lib/models/User";
import { sendEmail } from "@/utils/emailer";
import initializeDbAndModels from "@/lib/db";

export async function POST(req) {
  const db = await initializeDbAndModels();
  const { User } = db;
  try {
    const { email } = await req.json();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (user.isVerified) {
      return Response.json({ error: "Already verified" }, { status: 400 });
    }

    const token = jwt.sign({ id: user.id }, process.env.NEXTAUTH_SECRET, {
      expiresIn: "24h",
    });
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your account",
      html: `<p>Click the link to verify your account:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    });

    return Response.json({ message: "Verification email sent" });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
