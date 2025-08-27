// file: src/app/api/users/cancel-deletion/route.js

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { User } = await initializeDbAndModels();

  await User.update(
    {
      isPendingDeletion: false,
      deletionRequestedAt: null,
    },
    {
      where: { id: session.user.id },
    }
  );

  return new Response(JSON.stringify({ message: "Deletion canceled" }), {
    status: 200,
  });
}
