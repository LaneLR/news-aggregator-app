import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
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
      // is what actually applies model changes to the database. This is a
      // known risk once there's real production data (ALTER can lock large
      // tables or, if Sequelize misreads a diff, drop/recreate a column) —
      // set DISABLE_DB_SYNC=true to turn it off once migrations replace it.
      //
      // Also skipped during `next build` specifically: Next collects page
      // data across multiple parallel worker processes (each with its own
      // `global`, so the cold-start guard above doesn't dedupe across them),
      // and each one independently running `alter: true` at the same time
      // was racing the others — none see the others' in-flight constraint,
      // so every worker adds its own "new" unique index on every build.
      // This is what actually produced 670+ duplicate indexes on `Users`
      // (and the original 210 on `Articles.url`) over months of builds —
      // schema sync only needs to happen once, at real server startup.
      const isProductionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
      if (process.env.DISABLE_DB_SYNC !== "true" && !isProductionBuild) {
        await sequelize.sync({ alter: true });
      }

      // To fully reset data: drop tables in this order in PgAdmin (or via
      // psql) — SavedArticles, then Archives, then Users — and let the sync
      // above recreate them on the next request.
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
