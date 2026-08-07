// Manual, deliberate schema sync — the only place `sequelize.sync({ alter: true })`
// should ever run. Run this by hand (`npm run db:sync`) after changing a model,
// then don't run it again until the next model change. It is NOT wired into app
// boot (dev, build, or prod) because Sequelize's index-sync step re-adds a
// "missing" unique index on every single `.sync()` call — it never recognizes an
// already-existing index as matching the model's for this Postgres/Sequelize
// version combo. Automatic per-boot syncing is what produced hundreds of
// duplicate indexes in production before this script existed. This script sweeps
// up whatever duplicate it just created, so it's safe to rerun.
import "dotenv/config";
import initializeDbAndModels from "../src/lib/db.js";

process.env.RUN_DB_SYNC = "true";

async function dedupeUniqueIndexes(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT
      t.relname AS table_name,
      i.relname AS index_name,
      ix.indexrelid::bigint AS index_oid,
      con.conname AS constraint_name,
      array_agg(a.attname::text ORDER BY a.attnum) AS columns
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    LEFT JOIN pg_constraint con ON con.conindid = ix.indexrelid
    WHERE ix.indisunique = true
      AND ix.indisprimary = false
      AND n.nspname = 'public'
    GROUP BY t.relname, i.relname, ix.indexrelid, con.conname
    ORDER BY t.relname, columns;
  `);

  const groups = new Map();
  for (const row of rows) {
    const key = `${row.table_name}:${row.columns.join(",")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  let dropped = 0;
  for (const indexes of groups.values()) {
    if (indexes.length <= 1) continue;
    const sorted = [...indexes].sort((a, b) => (a.index_oid < b.index_oid ? -1 : 1));
    const duplicates = sorted.slice(1); // keep the oldest, drop the rest
    for (const dup of duplicates) {
      if (dup.constraint_name) {
        await sequelize.query(
          `ALTER TABLE "${dup.table_name}" DROP CONSTRAINT "${dup.constraint_name}"`
        );
      } else {
        await sequelize.query(`DROP INDEX "${dup.index_name}"`);
      }
      console.log(`  Dropped duplicate: ${dup.table_name}.${dup.index_name}`);
      dropped++;
    }
  }
  return dropped;
}

(async () => {
  console.log("Running deliberate schema sync (sequelize.sync({ alter: true }))...");
  const db = await initializeDbAndModels();
  console.log("Sync complete. Checking for duplicate unique indexes...");
  const dropped = await dedupeUniqueIndexes(db.sequelize);
  console.log(dropped > 0 ? `Cleaned up ${dropped} duplicate index(es).` : "No duplicates found.");
  await db.sequelize.close();
  process.exit(0);
})().catch((err) => {
  console.error("Schema sync failed:", err);
  process.exit(1);
});
