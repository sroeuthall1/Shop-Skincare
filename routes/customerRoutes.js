const { GetList, Create, Delete, Update } = require("../controllers/customerController");
const auth = require("../middlewares/auth");

const customer = (app) => {
  app.get("/customer", auth, GetList);
  app.post("/customer/create", auth, Create);
  app.delete("/customer/delete/:id", auth, Delete);
  app.put("/customer/update/:id", auth, Update);
};

module.exports = customer;