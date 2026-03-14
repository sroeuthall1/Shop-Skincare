const { GetList, Create, Delete,Update } = require("../controllers/unitController");

const unit = (app) => {
    app.get("/unit", GetList);
    app.post("/unit/create", Create);
    app.delete("/unit/delete/:id", Delete);
    app.put("/unit/update/:id", Update);
};

module.exports = unit;