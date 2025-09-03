import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { sendEmail } from "@/utils/emailer"; // 1. Import your emailer

export async function PATCH(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  const userId = body.userId;

  if (!userId || userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Invalid user ID" }), {
      status: 400,
    });
  }

  try {
    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    await user.update({
      isPendingDeletion: true,
      deletionRequestedAt: new Date(),
    });

    // 2. Send the confirmation email
    await sendEmail({
      to: user.email,
      subject: "Account Deletion Request Received",
      html: `<p>We have received your request to delete your account.</p>
             <p>Your account is scheduled for deletion in approximately 24 hours. If you did not request this, please secure your account immediately. If you've changed your mind, you can cancel this request by visiting your profile page.</p>`,
    });

    return new Response(
      JSON.stringify({ message: "Account scheduled for deletion." }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Database or email error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
