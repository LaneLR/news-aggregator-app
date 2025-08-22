// src/lib/db.js
import getSequelizeInstance from "./sequelize.js";
import User from "./models/User.js";
import Archive from "./models/Archive.js";
import SavedArticle from "./models/SavedArticle.js";
import defineJournalArticle from "./models/JournalArticle.js";
import defineNewsArticle from "./models/NewsArticle.js";
import { DataTypes, Op } from "sequelize";
import bcrypt from "bcryptjs";
import UserInteraction from "./models/UserInteraction.js";
import defineMarketArticle from "./models/MarketArticle.js";
import definePodcast from "./models/Podcast.js";

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

      User.init(
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
              isEmail: { msg: "Must be a valid email address" },
            },
            set: function (value) {
              this.setDataValue("email", value.toLowerCase());
            },
          },
          password: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          tier: {
            type: DataTypes.ENUM("Free", "Pro", "Pro Annual"),
            defaultValue: "Free",
          },
          // The unique ID for the user in Stripe's system.
          stripeCustomerId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
          },
          // The ID of their active subscription.
          stripeSubscriptionId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
          },
          // The ID of the specific price plan they are subscribed to.
          stripePriceId: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          // The current status of their subscription (e.g., "active", "canceled", "past_due").
          stripeSubscriptionStatus: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          // When the current subscription period ends.
          stripeSubscriptionEndsAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          emailIsVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          isPendingDeletion: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
        },
        {
          sequelize,
          modelName: "User",
          timestamps: true,
          hooks: {
            beforeCreate: async (user) => {
              if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
              }
            },
            beforeUpdate: async (user) => {
              if (user.changed("password")) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
              }
            },
            afterCreate: async (user, options) => {
              const { Archive } = user.sequelize.models;
              await Archive.create({
                name: "Saved for later",
                userId: user.id,
              });
            },
          },
          indexes: [
            {
              unique: true,
              fields: ["email"],
            },
            {
              unique: true,
              fields: ["stripeCustomerId"],
              where: {
                stripeCustomerId: {
                  [Op.ne]: null,
                },
              },
            },
            {
              unique: true,
              fields: ["stripeSubscriptionId"],
              where: {
                stripeCustomerId: {
                  [Op.ne]: null,
                },
              },
            },
            {
              fields: ["stripeSubscriptionStatus"],
            },
            {
              fields: ["tier"],
            },
          ],
        }
      );

      Archive.init(
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          userId: {
            type: DataTypes.UUID,
            allowNull: false,
          },
        },
        {
          sequelize,
          modelName: "Archive",
          timestamps: true,
          indexes: [
            {
              unique: true,
              fields: ["userId", "name"],
            },
          ],
        }
      );

      SavedArticle.init(
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          url: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: "archive_url_unique",
          },
          urlToImage: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          sourceName: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          publishedAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          archiveId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: "archive_url_unique",
          },
        },
        {
          sequelize,
          modelName: "SavedArticle",
          timestamps: true,
          indexes: [
            {
              unique: true,
              fields: ["url", "archiveId"], // Prevent duplicate saves in same archive
            },
          ],
        }
      );

      //UserInteraction is in testing; when ready uncomment

      // UserInteraction.init({
      //   userId: DataTypes.UUID,
      //   articleUrl: DataTypes.TEXT,
      //   interactionType: DataTypes.STRING, // 'click', 'search', 'save'
      //   timestamp: DataTypes.DATE,
      // });
      // global.db.UserInteraction = UserInteraction;

      global.db.sequelize = sequelize;
      global.db.User = User;
      global.db.Archive = Archive;
      global.db.SavedArticle = SavedArticle;
      global.db.NewsArticle = NewsArticle;
      global.db.JournalArticle = JournalArticle;
      global.db.MarketArticle = MarketArticle;
      global.db.Podcast = Podcast;

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

      // await sequelize.query(`ALTER TABLE "SavedArticles" DROP CONSTRAINT IF EXISTS "SavedArticles_url_key";`);

      // Uncomment the line below to alter tables without wiping data
      // await sequelize.sync({ alter: true });

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
