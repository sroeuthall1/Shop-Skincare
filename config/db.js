// const mysql = require("mysql2/promise");
require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'mysql://root:NIABxiTNuqTCFjemfhQNCJNKbkPvaXDX@mysql.railway.internal:3306/railway',
  {
    dialect: 'mysql'
  }
);


// const dbconn = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
//   waitForConnections: true,
//   connectionLimit: 10,
// });

module.exports = sequelize;
