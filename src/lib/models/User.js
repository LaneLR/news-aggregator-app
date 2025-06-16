// src/lib/models/User.js
import { Model, DataTypes } from "sequelize"; // DataTypes needs to be imported here
import bcrypt from "bcryptjs"; // bcrypt needs to be imported here for hooks

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

export default User;
