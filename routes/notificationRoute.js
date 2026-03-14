const { getExpiryNotifications } = require("../controllers/notificationController");

const notificationRoute = (app) => {
  // ✅ must be GET because frontend fetch uses GET + query string
  app.get("/api/notifications/expiry", getExpiryNotifications);
};

module.exports = notificationRoute;