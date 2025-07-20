import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// export async function GET() {
//   const session = await getServerSession(authOptions);
//   if (!session)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const db = await initializeDbAndModels();
//   const archives = await db.Archive.findAll({
//     where: { userId: session.user.id },
//   });

//   return NextResponse.json({ archives });
// }

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await initializeDbAndModels();
  const archives = await db.Archive.findAll({
    where: { userId: session.user.id },
    order: [["createdAt", "DESC"]],
  });

  return NextResponse.json({ archives });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const db = await initializeDbAndModels();
  const [archive, created] = await db.Archive.findOrCreate({
    where: {
      userId: session.user.id,
      name: name.trim(),
    },
  });

  return NextResponse.json({ archive });
}
