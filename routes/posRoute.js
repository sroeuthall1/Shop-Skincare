// routes/pos.js
const pos = require("../controllers/posController");
const auth = require("../middlewares/auth");

module.exports = (app) => {
  app.post("/pos/save", auth, pos.saveDraft); // ✅ add auth
};
