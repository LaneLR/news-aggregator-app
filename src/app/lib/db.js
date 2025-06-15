import { Sequelize } from "sequelize";

let sequelize;

if (!global.sequelize) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
  global.sequelize = sequelize;
} else {
  sequelize = global.sequelize;
}

export default sequelize;
