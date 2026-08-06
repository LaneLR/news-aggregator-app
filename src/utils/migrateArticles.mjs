// One-time migration: copies rows from the old per-category article tables
// (NewsArticles, JournalArticles, MarketArticles, Podcasts) into the new
// consolidated "Articles" table, tagging each row with its sourceType.
//
// Usage: node src/utils/migrateArticles.mjs
//
// Safe to re-run — uses ON CONFLICT (url) DO NOTHING, so already-migrated
// rows are skipped. Does NOT drop the old tables; prints the DROP TABLE
// statements to run manually once you've verified the migration looks right.
import "dotenv/config";
import initializeDbAndModels from "../lib/db.js";

const SOURCES = [
  { table: "NewsArticles", sourceType: "news", hasLikeCount: true },
  { table: "JournalArticles", sourceType: "journal", hasLikeCount: true },
  { table: "MarketArticles", sourceType: "market", hasLikeCount: true },
  { table: "Podcasts", sourceType: "podcast", hasLikeCount: false },
];

async function tableExists(sequelize, tableName) {
  const [rows] = await sequelize.query(
    `SELECT to_regclass('"${tableName}"') IS NOT NULL AS exists;`
  );
  return rows[0].exists;
}

async function migrate() {
  const { sequelize } = await initializeDbAndModels();

  let anyMigrated = false;

  for (const { table, sourceType, hasLikeCount } of SOURCES) {
    const exists = await tableExists(sequelize, table);
    if (!exists) {
      console.log(`Skipping ${table} — table not found (already migrated/dropped?).`);
      continue;
    }

    const likeCountSelect = hasLikeCount ? '"likeCount"' : "0";

    const [, meta] = await sequelize.query(`
      INSERT INTO "Articles"
        (title, url, "urlToImage", "sourceName", "publishedAt", country, category, "likeCount", "sourceType", "createdAt", "updatedAt")
      SELECT title, url, "urlToImage", "sourceName", "publishedAt", country, category, ${likeCountSelect}, '${sourceType}', "createdAt", "updatedAt"
      FROM "${table}"
      ON CONFLICT (url) DO NOTHING;
    `);

    anyMigrated = true;
    console.log(`Migrated from ${table} (sourceType='${sourceType}'). Rows affected: ${meta.rowCount ?? "unknown"}`);
  }

  if (anyMigrated) {
    console.log("\nMigration complete. Once you've verified the Articles table looks correct, drop the old tables manually:");
    for (const { table } of SOURCES) {
      console.log(`  DROP TABLE IF EXISTS "${table}";`);
    }
  } else {
    console.log("Nothing to migrate — no old tables found.");
  }

  await sequelize.close();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
