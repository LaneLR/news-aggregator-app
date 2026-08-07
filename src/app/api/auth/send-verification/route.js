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

    // Same generic response whether the account exists, is already
    // verified, or doesn't exist at all — avoids leaking account
    // existence/status to an unauthenticated caller (matches request-reset).
    if (!user || user.emailIsVerified) {
      return Response.json({
        message: "If that account needs verification, a new email has been sent.",
      });
    }

    const token = jwt.sign(
      { id: user.id, purpose: "verify-email" },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: "24h" }
    );
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your account",
      html: `<p>Click the link to verify your account:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    });

    return Response.json({
      message: "If that account needs verification, a new email has been sent.",
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
