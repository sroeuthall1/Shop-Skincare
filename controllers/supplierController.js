const db = require("../config/db");
const logError = require("../service/service");

const GetList = async (req, res) => {
    try {
        const SQL = "SELECT * FROM tblsupplier";
        const [rows] = await db.query(SQL);
        res.json({
            message: "Get supplier success",
            list: rows,
        });
    } catch (error) {
        logError("Supplier", error, res);
    }
};

const Create = async (req, res) => {
    try {
        const { SupplierName, Gender, Phone, Email, Address } = req.body;
        const SQL = `INSERT INTO tblsupplier (SupplierName, Gender, Phone, Email, Address) VALUES (?, ?, ?,?,?)`;
        const [result] = await db.query(SQL, [SupplierName, Gender, Phone, Email, Address]);

        res.status(201).json({
            message: "Supplier created successfully",
            insertedId: result.insertId,
            affectedRows: result.affectedRows,
            data: req.body
        });

    } catch (error) {
        logError("Supplier", error, res);
    }
};

const Delete = async (req, res) => {
  try {
    const id = req.params.id;

    const SQL = "DELETE FROM tblsupplier WHERE SupplierId = ?";
    const [result] = await db.query(SQL, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    return res.json({
      message: "Supplier deleted success",
      deleted: result.affectedRows,
      id,
    });
  } catch (error) {
    // ✅ Supplier ត្រូវបានប្រើ (FK constraint)
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "មិនអាចលុបបានទេ ព្រោះអ្នកផ្គត់ផ្គង់នេះត្រូវបានប្រើរួចហើយ",
      });
    }

    // ✅ always return JSON on other errors
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};


const Update = async (req, res) => {
    try {
        const id = req.params.id;
        const { SupplierName, Gender, Phone, Email, Address } = req.body;
        const SQL = `UPDATE tblsupplier SET SupplierName = ?, Gender = ?, Phone = ?, Email = ?, Address = ? WHERE SupplierId = ?`;
        const [result] = await db.query(SQL, [SupplierName, Gender, Phone, Email, Address, id]);
        res.json({
            message: "Supplier updated success",
            updated: result.affectedRows,
            id: id,
            newData: { SupplierName, Gender, Phone, Email, Address }
        });
    } catch (error) {
        logError("Supplier", error, res);
    }
}


module.exports = {GetList,Create,Delete,Update};
