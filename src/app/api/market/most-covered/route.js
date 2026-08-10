import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { getMostCoveredCompanies } from "@/lib/mostCovered";

export async function GET() {
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  if (!isSubscribed) {
    return NextResponse.json({ error: "Subscribed feature" }, { status: 403 });
  }

  try {
    const { Article } = await initializeDbAndModels();
    const companies = await getMostCoveredCompanies(Article);
    return NextResponse.json({ companies });
  } catch (err) {
    console.error("Error computing most-covered companies:", err);
    return NextResponse.json({ error: "Could not compute most-covered data" }, { status: 500 });
  }
}
