const { GetList, Create, Update, ToggleActive, Delete } = require("../controllers/discountController");
const auth = require("../middlewares/auth");

module.exports = (app) => {
  app.get("/discount", auth, GetList);
  app.post("/discount/create", auth, Create);
  app.put("/discount/update/:id", auth, Update);
  app.put("/discount/toggle/:id", auth, ToggleActive);
  app.delete("/discount/delete/:id", auth, Delete);
};
