import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Feeds here are filters over a shared, curated article pool (a set of
// source names + categories), not literal RSS subscriptions — this app's
// worker polls a fixed source list, it doesn't track arbitrary per-user
// feed URLs. So export is a portability/backup of *how you've organized
// things* (folder-per-Feed, source names as child outlines), not a literal
// resubscribe-elsewhere file — there's no real xmlUrl to put in it.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { Feed } = await initializeDbAndModels();
    const feeds = await Feed.findAll({
      where: { userId: session.user.id },
      order: [["createdAt", "ASC"]],
    });

    const body = feeds
      .map((feed) => {
        const sourceOutlines = (feed.sourceNames || [])
          .map((name) => `      <outline text="${escapeXml(name)}" />`)
          .join("\n");
        const categoryOutlines = (feed.categories || [])
          .map((name) => `      <outline text="${escapeXml(name)}" category="true" />`)
          .join("\n");

        return `    <outline text="${escapeXml(feed.title)}">
${[sourceOutlines, categoryOutlines].filter(Boolean).join("\n")}
    </outline>`;
      })
      .join("\n");

    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>MochaReads Feeds</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${body}
  </body>
</opml>`;

    return new NextResponse(opml, {
      status: 200,
      headers: {
        "Content-Type": "text/x-opml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mochareads-feeds.opml"',
      },
    });
  } catch (err) {
    console.error("Error exporting OPML:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
