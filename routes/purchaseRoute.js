const { GetList, Create, Update, Delete } = require("../controllers/purchaseController");
const auth = require("../middlewares/auth");

const purchase = (app) => {
  app.get("/purchase", GetList);

  app.post("/purchase/create", auth, Create);
  app.put("/purchase/update/:id", auth, Update);
  app.delete("/purchase/delete/:id", auth, Delete);
};

module.exports = purchase;
