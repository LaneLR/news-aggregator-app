import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";

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

    const [updatedRows] = await User.update(
      {
        isPendingDeletion: false,
        deletionRequestedAt: null,
      },
      {
        where: { id: userId },
      }
    );

    if (updatedRows === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: "Deletion canceled" }), {
      status: 200,
    });
  } catch (err) {
    console.error("Database update failed:", err);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}
