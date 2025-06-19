// src/lib/db.js
import getSequelizeInstance from './sequelize';
import User from './models/User';
import { DataTypes, Op } from "sequelize"; 
import bcrypt from 'bcryptjs';

if (!global.db) {
  global.db = {};
}

async function initializeDbAndModels() {
  if (!global.db.sequelize || !global.db.User) {
    try {
      console.log('Attempting to get Sequelize instance and initialize models...');
      const sequelize = await getSequelizeInstance();
      console.log('Sequelize instance obtained, initializing User model...');

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
                [Op.ne]: null, 
              },
            },
            {
              unique: true,
              fields: ["subscriptionId"],
              where: {
                [Op.ne]: null, // <--- And here
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

      global.db.sequelize = sequelize;
      global.db.User = User;

    //   await sequelize.sync();
    //   console.log('All models were synchronized successfully.');

    } catch (error) {
      console.error('----------------------------------------------------');
      console.error('FATAL: Error initializing database or models during build:');
      console.error('Error Message:', error.message || 'No specific error message provided.');
      console.error('Error Name:', error.name || 'N/A');
      console.error('Error Code:', error.code || 'N/A'); // Network errors often have a code
      console.error('Stack Trace:', error.stack);
      console.error('----------------------------------------------------');
      throw error
    }
  }
  return global.db;
}

export default initializeDbAndModels;
