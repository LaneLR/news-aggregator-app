import { Sequelize } from "sequelize";

let sequelize;

if (!global.sequelize) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10, //max number of connections in the pool
      min: 0, //min number of connections in the pool
      acquire: 30000, //max wait time for a connection
      idle: 10000, //max idle time before a connection is released
    },
  });
  global.sequelize = sequelize;
} else {
  sequelize = global.sequelize;
}

export default sequelize;
