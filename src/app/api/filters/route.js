import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { Sequelize } from "sequelize";

export async function GET(req) {
  try {
    const { NewsArticle, JournalArticle, MarketArticle } = await initializeDbAndModels();

    const [newsSources, journalSources, marketSources, newsCategories, journalCategories, marketCategories] = await Promise.all([
      NewsArticle.findAll({ attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("sourceName")), "sourceName"]] }),
      JournalArticle.findAll({ attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("sourceName")), "sourceName"]] }),
      MarketArticle.findAll({ attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("sourceName")), "sourceName"]] }),
      NewsArticle.findAll({ attributes: ["category"] }),
      JournalArticle.findAll({ attributes: ["category"] }),
      MarketArticle.findAll({ attributes: ["category"] }),
    ]);
    
    const allSources = [...newsSources, ...journalSources, ...marketSources].map(s => s.sourceName);
    const allCategories = [...newsCategories, ...journalCategories, ...marketCategories]
      .flatMap(item => item.category || [])
      .filter(Boolean);

    const uniqueSources = [...new Set(allSources)].sort();
    const uniqueCategories = [...new Set(allCategories)].sort();

    return NextResponse.json({ sources: uniqueSources, categories: uniqueCategories });

  } catch (err) {
    console.error("Error fetching filters:", err);
    return NextResponse.json({ error: "Could not fetch filters" }, { status: 500 });
  }
}