import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { Sequelize } from "sequelize";

export async function GET(req) {
  try {
    const { Article } = await initializeDbAndModels();

    const [sources, categoryRows] = await Promise.all([
      Article.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("sourceName")), "sourceName"]],
      }),
      Article.findAll({ attributes: ["category"] }),
    ]);

    const uniqueSources = [...new Set(sources.map((s) => s.sourceName))]
      .filter(Boolean)
      .sort();
    const uniqueCategories = [
      ...new Set(categoryRows.flatMap((item) => item.category || [])),
    ]
      .filter(Boolean)
      .sort();

    return NextResponse.json({ sources: uniqueSources, categories: uniqueCategories });
  } catch (err) {
    console.error("Error fetching filters:", err);
    return NextResponse.json({ error: "Could not fetch filters" }, { status: 500 });
  }
}
