// backend/routes/stockReportRoute.js
const stockReport = require("../controllers/stockReportController");

module.exports = (app) => {
  app.get("/reports/stock/daily", stockReport.daily);
  app.get("/reports/stock/monthly", stockReport.monthly);
  app.get("/reports/stock/balance", stockReport.balance);
};
