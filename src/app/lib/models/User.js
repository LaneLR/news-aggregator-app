const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const bcrypt = require("bcrypt");

class User extends Model {
  // Method to compare password
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}
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
    //tier is the user's subscription level
    //0 is registered user, 1 is subscribed registered user, 2 is admin
    tier: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 2,
      },
    },
    paymentProvider: {
      type: DataTypes.STRING, // 'stripe', 'paddle', etc.
      defaultValue: "stripe", // Default to 'stripe' if that's your primary
    },
    providerCustomerId: {
      type: DataTypes.STRING, // e.g., Stripe's 'cus_abc123'
      unique: true, // Each customer ID from a provider should be unique
      allowNull: true, // Allow null for users without a payment customer ID yet
    },
    subscriptionId: {
      type: DataTypes.STRING, // Stripe's subscription ID if using recurring plans
      unique: true, // Each subscription ID should be unique
      allowNull: true,
    },
    subscriptionStatus: {
      type: DataTypes.STRING, // 'active', 'canceled', 'cancelled_missed_payment', 'trialing', etc.
      defaultValue: "inactive", // Initialize to a safe default
    },
    subscriptionPlanId: {
      // New: Stores the ID of the subscription plan from the provider
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardLast4: {
      type: DataTypes.STRING, // Optional for display only
      allowNull: true,
    },
    cardBrand: {
      type: DataTypes.STRING, // 'Visa', 'Mastercard', etc.
      allowNull: true,
    },
    subscriptionStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscriptionExpiresAt: {
      type: DataTypes.DATE, // Can be used to track trial or canceled access
      allowNull: true,
    },
    isTrial: {
      //Flag for trial period
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    trialEnd: {
      //End date of trial
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastPaymentAttempt: {
      //Track last payment attempt
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastPaymentStatus: {
      //Status of last payment attempt
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
          // Only enforce uniqueness if providerCustomerId is not null
          providerCustomerId: {
            [require("sequelize").Op.ne]: null,
          },
        },
      },
      {
        unique: true,
        fields: ["subscriptionId"],
        where: {
          // Only enforce uniqueness if subscriptionId is not null
          subscriptionId: {
            [require("sequelize").Op.ne]: null,
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

module.exports = User;
