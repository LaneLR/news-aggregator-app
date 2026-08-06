import getSequelizeInstance from "./sequelize.js";
import defineArticle from "./models/Article.js";
import defineFeed from "./models/Feed.js";
import defineArticleLike from "./models/ArticleLike.js";
import defineUser from "./models/User.js";
import defineArchive from "./models/Archive.js";
import defineSavedArticle from "./models/SavedArticle.js";
import defineProcessedStripeEvent from "./models/ProcessedStripeEvent.js";

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

      global.db.sequelize = sequelize;
      global.db.User = User;
      global.db.Archive = Archive;
      global.db.SavedArticle = SavedArticle;
      global.db.Article = Article;
      global.db.Feed = Feed;
      global.db.ArticleLike = ArticleLike;
      global.db.ProcessedStripeEvent = ProcessedStripeEvent;

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

      // There's no formal migration tooling in this project yet, so `alter`
      // is what actually applies model changes to the database. This is a
      // known risk once there's real production data (ALTER can lock large
      // tables or, if Sequelize misreads a diff, drop/recreate a column) —
      // set DISABLE_DB_SYNC=true to turn it off once migrations replace it.
      if (process.env.DISABLE_DB_SYNC !== "true") {
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
