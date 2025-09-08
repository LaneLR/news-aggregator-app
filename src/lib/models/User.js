import { DataTypes, Model, Op } from "sequelize";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

export default function defineUser(sequelize) {
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
        validate: { isEmail: { msg: "Must be a valid email address" } },
        set(value) {
          this.setDataValue("email", value.toLowerCase());
        },
      },
      password: { type: DataTypes.STRING, allowNull: true },
      tier: {
        type: DataTypes.ENUM("Free", "Pro", "Pro Annual"),
        defaultValue: "Free",
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      stripePriceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripeSubscriptionStatus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
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
      deletionRequestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      referralCode: {
        type: DataTypes.STRING(8),
        unique: true,
        allowNull: false,
      },
      usedReferralCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      referralCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      subscriptionWillCancel: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          // Generate a unique referral code before the user is created
          user.referralCode = nanoid(8).toUpperCase();
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
          await Archive.findOrCreate({
            where: {
              name: "Saved for later",
              userId: user.id,
            },
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
  return User;
}
