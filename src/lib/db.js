import getSequelizeInstance from "./sequelize.js";
import defineArticle from "./models/Article.js";
import defineFeed from "./models/Feed.js";
import defineArticleLike from "./models/ArticleLike.js";
import defineUser from "./models/User.js";
import defineArchive from "./models/Archive.js";
import defineSavedArticle from "./models/SavedArticle.js";
import defineProcessedStripeEvent from "./models/ProcessedStripeEvent.js";
import defineUserInteraction from "./models/UserInteraction.js";
import defineReadArticle from "./models/ReadArticle.js";
import defineMarketQuote from "./models/MarketQuote.js";
import defineMarketChartCache from "./models/MarketChartCache.js";

if (!global.db) {
  global.db = {};
}

async function initializeDbAndModels() {
  if (!global.db.sequelize || !global.db.User) {
    try {
      console.log(
        "Attempting to get Sequelize instance and initialize models..."
      );
      const sequelize = await getSequelizeInstance();
      console.log("Sequelize instance obtained, initializing User model...");

      const Article = defineArticle(sequelize);
      const Feed = defineFeed(sequelize);
      const ArticleLike = defineArticleLike(sequelize);
      const User = defineUser(sequelize);
      const Archive = defineArchive(sequelize);
      const SavedArticle = defineSavedArticle(sequelize);
      const ProcessedStripeEvent = defineProcessedStripeEvent(sequelize);
      const UserInteraction = defineUserInteraction(sequelize);
      const ReadArticle = defineReadArticle(sequelize);
      const MarketQuote = defineMarketQuote(sequelize);
      const MarketChartCache = defineMarketChartCache(sequelize);

      global.db.sequelize = sequelize;
      global.db.User = User;
      global.db.Archive = Archive;
      global.db.SavedArticle = SavedArticle;
      global.db.Article = Article;
      global.db.Feed = Feed;
      global.db.ArticleLike = ArticleLike;
      global.db.ProcessedStripeEvent = ProcessedStripeEvent;
      global.db.UserInteraction = UserInteraction;
      global.db.ReadArticle = ReadArticle;
      global.db.MarketQuote = MarketQuote;
      global.db.MarketChartCache = MarketChartCache;

      User.hasMany(Archive, { foreignKey: "userId", onDelete: "CASCADE" });
      Archive.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

      Archive.hasMany(SavedArticle, {
        foreignKey: "archiveId",
        onDelete: "CASCADE",
      });
      SavedArticle.belongsTo(Archive, {
        foreignKey: "archiveId",
        onDelete: "CASCADE",
      });

      User.hasMany(Feed, { foreignKey: "userId", onDelete: "CASCADE" });
      Feed.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

      User.hasMany(ArticleLike, { foreignKey: "userId" });
      ArticleLike.belongsTo(User, { foreignKey: "userId" });

      User.hasMany(UserInteraction, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
      UserInteraction.belongsTo(User, { foreignKey: "userId" });

      User.hasMany(ReadArticle, { foreignKey: "userId", onDelete: "CASCADE" });
      ReadArticle.belongsTo(User, { foreignKey: "userId" });

      // There's no formal migration tooling in this project yet, so `alter`
      // is what actually applies model changes to the database — but it is
      // NOT run automatically here. Sequelize's index-sync step runs on
      // every single `.sync()` call regardless of the alter/force options,
      // and for this Postgres/Sequelize version combo it never recognizes
      // an existing unique index as matching the model's, so it re-adds a
      // "new" duplicate every time. Running this on every cold start (every
      // `next dev` restart, every `next build` worker, every Vercel
      // serverless invocation) is what produced 670+ duplicate indexes on
      // `Users` and 210+ on `Articles.url` over time — the parallel build
      // workers and the RSS fetcher's own per-run `sequelize.sync()` call
      // both independently contributed.
      //
      // Schema sync is now a deliberate, manual action: run `npm run
      // db:sync` (scripts/sync-db.mjs) after changing a model, then don't
      // run it again until the next model change. That script also sweeps
      // up whatever duplicate index it just created, so it's safe to rerun.
      if (process.env.RUN_DB_SYNC === "true") {
        await sequelize.sync({ alter: true });
      }
    } catch (error) {
      console.error("----------------------------------------------------");
      console.error(
        "FATAL: Error initializing database or models during build:"
      );
      console.error(
        "Error Message:",
        error.message || "No specific error message provided."
      );
      console.error("Error Name:", error.name || "N/A");
      console.error("Error Code:", error.code || "N/A");
      console.error("Stack Trace:", error.stack);
      console.error("----------------------------------------------------");
      throw error;
    }
  }
  return global.db;
}

export default initializeDbAndModels;
