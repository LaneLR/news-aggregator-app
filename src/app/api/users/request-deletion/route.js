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

  const body = await req.json();
  const userId = body.userId;

  if (!userId || userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Invalid user ID" }), {
      status: 400,
    });
  }

  const { User } = await initializeDbAndModels();
  const user = await User.findByPk(session.user.id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const [updatedRows] = await User.update(
      {
        isPendingDeletion: true,
        deletionRequestedAt: new Date(),
      },
      { where: { id: userId } }
    );

    if (updatedRows === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Account scheduled for deletion." }),
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error("Database update failed:", err);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}
