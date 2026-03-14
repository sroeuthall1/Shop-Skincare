const { GetList, Create, Delete, Update, GetByCategory, ToggleActive } = require("../controllers/productController");
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");

const product = (app) => {
    app.get("/product", GetList);
    app.post("/product/create", auth, upload.single("Photo"), Create);
    app.delete("/product/delete/:id", auth, Delete);
    app.put("/product/update/:id", auth, upload.single("Photo"), Update);
    app.put("/product/toggle/:id", auth, ToggleActive);
    app.get("/brand/category/:categoryId", GetByCategory);

};

module.exports = product;