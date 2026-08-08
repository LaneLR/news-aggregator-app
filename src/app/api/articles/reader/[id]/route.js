import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getArticleReaderData } from "@/lib/articleReaderData";

// Powers the 3-pane reading-pane view — same data as the full article page
// (src/app/article/[id]/page.js), just fetched client-side so selecting an
// article in the list pane doesn't require a full page navigation.
export async function GET(req, { params }) {
  const { id } = await params;
  const session = await auth();

  const data = await getArticleReaderData(id, session);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (data.gated) {
    return NextResponse.json({ error: "Subscription required", gated: true }, { status: 403 });
  }

  return NextResponse.json(data);
}
