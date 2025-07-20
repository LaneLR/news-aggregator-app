// src/lib/db.js
import getSequelizeInstance from "./sequelize.js";
import User from "./models/User.js";
import Archive from "./models/Archive.js";
import SavedArticle from "./models/SavedArticle.js";
import { DataTypes, Op } from "sequelize";
import bcrypt from "bcryptjs";

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
            unique: {
              msg: "Email address already exists",
            },
            validate: {
              notEmpty: { msg: "Email is required" },
              isEmail: { msg: "Must be a valid email address" },
            },
            set: function (value) {
              this.setDataValue("email", value.toLowerCase());
            },
          },
          password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
              notEmpty: { msg: "Password is required" },
              len: {
                args: [6, 100],
                msg: "Password must be at least 6 characters",
              },
            },
          },
          tier: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
              min: 0,
              max: 2,
            },
          },
          paymentProvider: {
            type: DataTypes.STRING,
            defaultValue: "stripe",
          },
          providerCustomerId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
          },
          subscriptionId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
          },
          subscriptionStatus: {
            type: DataTypes.STRING,
            defaultValue: "inactive",
          },
          subscriptionPlanId: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          cardLast4: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          cardBrand: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          subscriptionStart: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          subscriptionExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          isTrial: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          trialEnd: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          lastPaymentAttempt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          lastPaymentStatus: {
            type: DataTypes.STRING,
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: "user",
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
              fields: ["providerCustomerId"],
              where: {
                providerCustomerId: {
                  [Op.ne]: null,
                },
              },
            },
            {
              unique: true,
              fields: ["subscriptionId"],
              where: {
                providerCustomerId: {
                  [Op.ne]: null,
                },
              },
            },
            {
              fields: ["subscriptionStatus"],
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
              fields: ["url", "archiveId"], 
            },
          ],
        }
      );

      global.db.sequelize = sequelize;
      global.db.User = User;
      global.db.Archive = Archive;
      global.db.SavedArticle = SavedArticle;

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
      await sequelize.sync({ force: true });
      console.log("All models were synchronized and created successfully.");
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
