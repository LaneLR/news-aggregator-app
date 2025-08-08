// /api/users/request-deletion.js
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";

export async function DELETE(req) {
  const session = await getServerSession(); // or however you check auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { User } = await initializeDbAndModels();

  await User.update(
    {
      pendingDeletion: true,
      deletionRequestedAt: new Date(),
    },
    { where: { email: session.user.email } }
  );

  return Response.json({
    message: "Account scheduled for deletion in 24 hours.",
  });
}
