// routes/reportRoutes.js (ឬ file routes ដែលអ្នកប្រើ)
const report = require("../controllers/reportController");

module.exports = (app) => {
  app.get("/reports/buy/daily", report.buyDaily);
  app.get("/reports/buy/monthly", report.buyMonthly);
};