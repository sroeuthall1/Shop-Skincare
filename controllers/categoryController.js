const categoryModel = require("../models/categoryModel");
const logError = require("../service/service");

const GetList = async (req, res) => {
  try {
    const [rows] = await categoryModel.getAllCategories();
    res.json({
      message: "Get category success",
      list: rows,
    });
  } catch (error) {
    logError("Category", error, res);
  }
};

const Create = async (req, res) => {
  try {
    const { CategoryName, Description } = req.body;
    const [result] = await categoryModel.createCategory(CategoryName, Description);

    res.status(201).json({
      message: "Category created successfully",
      insertedId: result.insertId,
      affectedRows: result.affectedRows,
      data: req.body,
    });
  } catch (error) {
    logError("Category", error, res);
  }
};

const Delete = async (req, res) => {
  try {
    const id = req.params.id;

    const [result] = await categoryModel.deleteCategory(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({
      message: "Category deleted success",
      deleted: result.affectedRows,
      id,
    });
  } catch (error) {
    // ✅ Category មានគេប្រើ (FK)
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "មិនអាចលុបបានទេ ព្រោះប្រភេទផលិតផលនេះត្រូវបានប្រើរួចហើយ",
      });
    }

    // ✅ error ផ្សេងៗ
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};


const Update = async (req, res) => {
  try {
    const id = req.params.id;
    const { CategoryName, Description } = req.body;
    const [result] = await categoryModel.updateCategory(CategoryName, Description, id);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Category not found" });

    res.json({
      message: "Category updated success",
      updated: result.affectedRows,
      id: id,
      newData: { CategoryName, Description },
    });
  } catch (error) {
    logError("Category", error, res);
  }
};

module.exports = { GetList, Create, Delete, Update };
