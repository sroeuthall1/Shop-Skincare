const {GetList,Create,Delete, Update, GetById} = require("../controllers/invoiceController");
const allowRoles = require("../middlewares/allowRoles");
const auth = require("../middlewares/auth");

const invoice = (app) => {
  app.get("/invoice", GetList);
  app.get("/invoice/:id", GetById);
  app.post("/invoice/create", Create);
  app.delete("/invoice/delete/:id", Delete);
  app.put("/invoice/update/:id", Update);
};


module.exports = invoice;
