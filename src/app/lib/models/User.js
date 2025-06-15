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
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Username already exists",
      },
      validate: {
        notEmpty: { msg: "Username is required" },
        len: {
          args: [3, 30],
          msg: "Username must be between 3 and 30 characters",
        },
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
    email: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: { msg: "Must input an email" },
      },
    },
    //tier is the user's subscription level
    //0 is free, 1 is subscribed
    tier: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "user",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

module.exports = User;
