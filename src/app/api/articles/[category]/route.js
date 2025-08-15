import initializeDbAndModels from "@/lib/db";
import { NextResponse } from "next/server";
import { Op } from "sequelize";

export async function GET(req, { params }) {
  const { NewsArticle } = await initializeDbAndModels();

  const { category } = params;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  try {
    const { count, rows: articles } = await NewsArticle.findAndCountAll({
      where: {
        category: {
          [Op.contains]: [categoryName],
        },
      },
      order: [["publishedAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return NextResponse.json({
      articles,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error(
      `Failed to fetch articles for category "${categoryName}":`,
      err
    );

    return NextResponse.json(
      { error: "Failed to fetch articles from the database." },
      { status: 500 }
    );
  }
}
