// src/lib/sequelize.js
import { Sequelize } from "sequelize";
import * as pg from 'pg'; 
import 'pg-hstore'; 

let sequelizeInstance;

async function getSequelizeInstance() {
  if (!sequelizeInstance) {
    try {

      if (!pg || Object.keys(pg).length === 0) {
          console.error("DEBUG: pg import seems empty or failed.");
      } else {
          console.log("DEBUG: pg imported successfully. Keys:", Object.keys(pg));
      }


      if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set in environment variables. Current env:", process.env);
        throw new Error("Database URL is missing.");
      }
      console.log("Attempting to connect with DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:(.*?)\@/, ':****@') : 'N/A');

      sequelizeInstance = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectModule: pg, 
        logging: false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        // dialectOptions: {
        //   ssl: {
        //     require: true,
        //     rejectUnauthorized: false
        //   }
        // }
      });

      await sequelizeInstance.authenticate();
      console.log('Database connection established successfully');

    } catch (error) {
      console.error('Unable to connect to database or initialize Sequelize:', error);
      throw error;
    }
  }
  return sequelizeInstance;
}

export default getSequelizeInstance;
