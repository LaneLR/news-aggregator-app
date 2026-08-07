import jwt from "jsonwebtoken";
import { sendEmail } from "@/utils/emailer";
import initializeDbAndModels from "@/lib/db";
import { authRateLimitMiddleware } from "@/lib/rate-limiter";

export async function POST(req) {
  try {
    await authRateLimitMiddleware(req);
  } catch (err) {
    return Response.json({ error: err.message }, { status: err.status || 429 });
  }

  const db = await initializeDbAndModels();
  const { User } = db;
  try {
    const { email } = await req.json();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return Response.json({
        message: "Password reset link has been sent to your email.",
      });
    }

    // Bumping tokenVersion invalidates any previously issued reset links
    // for this user, so only the most recently requested link works.
    user.tokenVersion += 1;
    await user.save();

    const token = jwt.sign(
      { id: user.id, purpose: "reset-password", v: user.tokenVersion },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: "1h" }
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/password-reset?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click the link below to reset the password for your MorningFeeds account:</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>This link will expire in 1 hour.</p>`,
    });

    return Response.json({ message: "Password reset email sent." });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
