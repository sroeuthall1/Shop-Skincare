const {GetList,Create,Delete, Update} = require("../controllers/categoryController");

const category = (app) => {
  app.get("/category", GetList);
  app.post("/category/create", Create);
  app.delete("/category/delete/:id", Delete);
  app.put("/category/update/:id", Update);
};

module.exports = category;
