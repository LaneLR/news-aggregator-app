import jwt from "jsonwebtoken";
import { User } from "@/lib/models/User";
import { sendEmail } from "@/utils/emailer";

export async function POST(req) {
  try {
    const { email } = await req.json();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const token = jwt.sign({ id: user.id }, process.env.NEXTAUTH_SECRET, { expiresIn: "1h" });
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/reset/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click to reset your password to your RelayNews account:</p>
              <a href="${resetUrl}">${resetUrl}</a>`,
    });

    return Response.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
