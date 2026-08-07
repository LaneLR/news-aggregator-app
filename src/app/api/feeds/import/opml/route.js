import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { XMLParser } from "fast-xml-parser";

// Recursively pulls every outline's text/title out of a parsed OPML tree,
// however deeply nested (folders-within-folders are common in exports from
// other readers).
function collectOutlineNames(node, names = []) {
  if (!node) return names;
  const outlines = Array.isArray(node) ? node : [node];

  for (const outline of outlines) {
    const label = outline["@_text"] || outline["@_title"];
    if (label) names.push(String(label).trim());
    if (outline.outline) collectOutlineNames(outline.outline, names);
  }

  return names;
}

function namesMatch(a, b) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.tier === "Free") {
    return NextResponse.json(
      { error: "This feature is for subscribers only." },
      { status: 403 }
    );
  }

  try {
    const { opmlText, title } = await req.json();
    if (!opmlText || typeof opmlText !== "string") {
      return NextResponse.json({ error: "No OPML content provided." }, { status: 400 });
    }

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    let parsed;
    try {
      parsed = parser.parse(opmlText);
    } catch {
      return NextResponse.json({ error: "That file isn't valid OPML/XML." }, { status: 400 });
    }

    const body = parsed?.opml?.body;
    if (!body?.outline) {
      return NextResponse.json({ error: "No feeds found in that file." }, { status: 400 });
    }

    const importedNames = [...new Set(collectOutlineNames(body.outline))];
    if (importedNames.length === 0) {
      return NextResponse.json({ error: "No feeds found in that file." }, { status: 400 });
    }

    const { Article, Feed } = await initializeDbAndModels();
    const sourceRows = await Article.findAll({
      attributes: [[Article.sequelize.fn("DISTINCT", Article.sequelize.col("sourceName")), "sourceName"]],
    });
    const knownSources = sourceRows.map((r) => r.sourceName).filter(Boolean);

    const matchedSources = [];
    const skipped = [];
    for (const name of importedNames) {
      const match = knownSources.find((known) => namesMatch(known, name));
      if (match && !matchedSources.includes(match)) {
        matchedSources.push(match);
      } else if (!match) {
        skipped.push(name);
      }
    }

    if (matchedSources.length === 0) {
      return NextResponse.json({
        error: "None of the sources in that file are ones MorningFeeds currently carries.",
        skipped,
      }, { status: 400 });
    }

    const feed = await Feed.create({
      title: title?.trim() || "Imported Feed",
      sourceNames: matchedSources,
      categories: [],
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        feed,
        matchedCount: matchedSources.length,
        skippedCount: skipped.length,
        skipped,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error importing OPML:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
