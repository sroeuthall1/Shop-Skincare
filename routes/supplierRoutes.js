
const { GetList, Create, Delete,Update } = require("../controllers/supplierController");

const supplier = (app) => {
    app.get("/supplier", GetList);
    app.post("/supplier/create", Create);
    app.delete("/supplier/delete/:id", Delete);
    app.put("/supplier/update/:id", Update);
};

module.exports = supplier;