const { pay } = require("../controllers/paymentController");
const auth = require("../middlewares/auth");

module.exports = (app) => {
  app.post("/payment/pay", auth, pay); // ✅ add auth
};
