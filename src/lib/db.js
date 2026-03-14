import getSequelizeInstance from "./sequelize.js";
import defineJournalArticle from "./models/JournalArticle.js";
import defineNewsArticle from "./models/NewsArticle.js";
import defineMarketArticle from "./models/MarketArticle.js";
import definePodcast from "./models/Podcast.js";
import defineFeed from "./models/Feed.js";
import defineArticleLike from "./models/ArticleLike.js";
import defineUser from "./models/User.js";
import defineArchive from "./models/Archive.js";
import defineSavedArticle from "./models/SavedArticle.js";

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

      const NewsArticle = defineNewsArticle(sequelize);
      const JournalArticle = defineJournalArticle(sequelize);
      const MarketArticle = defineMarketArticle(sequelize);
      const Podcast = definePodcast(sequelize);
      const Feed = defineFeed(sequelize);
      const ArticleLike = defineArticleLike(sequelize);
      const User = defineUser(sequelize);
      const Archive = defineArchive(sequelize);
      const SavedArticle = defineSavedArticle(sequelize);

    
      global.db.sequelize = sequelize;
      global.db.User = User;
      global.db.Archive = Archive;
      global.db.SavedArticle = SavedArticle;
      global.db.NewsArticle = NewsArticle;
      global.db.JournalArticle = JournalArticle;
      global.db.MarketArticle = MarketArticle;
      global.db.Podcast = Podcast;
      global.db.Feed = Feed;
      global.db.ArticleLike = ArticleLike;
      global.db.User = User;
      global.db.SavedArticle = SavedArticle;
      global.db.Archive = Archive;

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

      // await sequelize.query(`ALTER TABLE "SavedArticles" DROP CONSTRAINT IF EXISTS "SavedArticles_url_key";`);

      // Uncomment the line below to alter tables without wiping data
      await sequelize.sync({ alter: true });

      //DO NOT REMOVE COMMENTS FROM BELOW LINE
      //Wipes all data from the database and re-creates tables

      //to reset data, follow these steps:
      //1. delete tables in this order on PgAdmin4: SavedArticles, then Archives, then users
      //2. uncomment the sync line, then create a new account to repopulate the tables

      // await sequelize.sync({ force: true });
      // console.log("All models were synchronized and created successfully.");
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
