import initializeDbAndModels from "@/lib/db";
import { NextResponse } from "next/server";
import { Op } from "sequelize";

export async function GET(req, { params }) {
  // Initialize all the models you need to search through.
  const { NewsArticle, MarketArticle, JournalArticle, Podcast } =
    await initializeDbAndModels();

  const { category } = await params;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  // Prepare the category name for the query.
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  try {
    // An array to hold promises for fetching data from each model.
    const promises = [
      NewsArticle.findAll({ where: { category: { [Op.contains]: [categoryName] } } }),
      MarketArticle.findAll({ where: { category: { [Op.contains]: [categoryName] } } }),
      JournalArticle.findAll({ where: { category: { [Op.contains]: [categoryName] } } }),
      Podcast.findAll({ where: { category: { [Op.contains]: [categoryName] } } }),
    ];

    // Execute all find operations in parallel.
    const results = await Promise.all(promises);

    // Combine all the results into a single flat array.
    // We add a 'type' property to each item to distinguish its source model, which can be useful on the frontend.
    const allContent = [
      ...results[0].map(item => ({ ...item.toJSON(), type: 'News' })),
      // ...results[1].map(item => ({ ...item.toJSON(), type: 'Market' })),
      // ...results[2].map(item => ({ ...item.toJSON(), type: 'Journal' })),
      // ...results[3].map(item => ({ ...item.toJSON(), type: 'Podcast' })),
    ];


    // Shuffle the combined array randomly using the Fisher-Yates algorithm.
    // This replaces the previous date-based sorting.
    for (let i = allContent.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allContent[i], allContent[j]] = [allContent[j], allContent[i]];
    }

    // Get the total count of all items before pagination.
    const total = allContent.length;

    // Apply pagination to the now-shuffled array.
    const paginatedContent = allContent.slice(offset, offset + limit);

    // Return the paginated content and pagination metadata.
    return NextResponse.json({
      articles: paginatedContent,
      total: total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(
      `Failed to fetch content for category "${categoryName}":`,
      err
    );

    return NextResponse.json(
      { error: "Failed to fetch content from the database." },
      { status: 500 }
    );
  }
}
