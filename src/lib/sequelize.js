// src/lib/sequelize.js
import { Sequelize } from "sequelize";
import * as pg from "pg";
import "pg-hstore";

let sequelizeInstance;

async function getSequelizeInstance() {
  if (!sequelizeInstance) {
    try {
      if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set in environment variables.");
        throw new Error("Database URL is missing.");
      }
      console.log(
        "Attempting to connect with DATABASE_URL:",
        process.env.DATABASE_URL
          ? process.env.DATABASE_URL.replace(/:(.*?)\@/, ":****@")
          : "N/A"
      );

      sequelizeInstance = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectModule: pg,
        logging: false,
        pool: {
          max: 10, //max number of connections in the pool
          min: 0, //min number of connections in the pool
          acquire: 30000, //max wait time for a connection
          idle: 10000, //max idle time before a connection is released
        },
        dialectOptions: {
          ssl: {
            require: true,
            // Verified against the real Neon endpoint before flipping this —
            // Neon's certificate chains to a public CA Node already trusts,
            // so this doesn't need a custom CA bundle. Previously `false`,
            // which accepted any certificate and left the connection open
            // to on-path MITM despite being "encrypted".
            rejectUnauthorized: true
          }
        }
      });

      await sequelizeInstance.authenticate();
      console.log("Database connection established successfully");
    } catch (error) {
      console.error(
        "Unable to connect to database or initialize Sequelize:",
        error
      );
      throw error;
    }
  }
  return sequelizeInstance;
}

export default getSequelizeInstance;
