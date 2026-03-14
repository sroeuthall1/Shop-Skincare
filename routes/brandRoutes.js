const {GetList,Create,Delete, Update} = require("../controllers/brandController");
const allowRoles = require("../middlewares/allowRoles");
const auth = require("../middlewares/auth");

const brand = (app) => {
  app.get("/brand", GetList);
  app.post("/brand/create", Create);
  app.delete("/brand/delete/:id", Delete);
  app.put("/brand/update/:id", Update);
};

module.exports = brand;
