// routes/reportRoute.js
const reportController = require("../controllers/reportController");
const auth = require("../middlewares/auth");

module.exports = (app) => {
  // Sale report
  app.get("/reports/sale/daily", auth, reportController.saleDaily);
  app.get("/reports/sale/monthly", auth, reportController.saleMonthly);

  // Buy report
  app.get("/reports/buy/daily", reportController.buyDaily);
  app.get("/reports/buy/monthly", reportController.buyMonthly);
};
