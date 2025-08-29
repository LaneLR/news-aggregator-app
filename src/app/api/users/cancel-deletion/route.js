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

  try {
    const body = await req.json();
    const userId = body.userId;

    if (!userId || userId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Invalid user ID" }), {
        status: 400,
      });
    }

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(userId);

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    await user.update({
      isPendingDeletion: false,
      deletionRequestedAt: null,
    });

    // 2. Send the confirmation email
    await sendEmail({
      to: user.email,
      subject: "Account Deletion Has Been Canceled",
      html: `<p>Your request to delete your account has been successfully canceled.</p>
             <p>Your account will remain active. Thank you for staying with us!</p>`,
    });

    return new Response(JSON.stringify({ message: "Deletion canceled" }), {
      status: 200,
    });
  } catch (err) {
    console.error("Database or email error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
