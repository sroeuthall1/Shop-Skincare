const db = require("../config/db");
const logError = require("../service/service");

const GetList = async (req, res) => {
  try {
    const SQL = "SELECT * FROM tblcustomer ORDER BY CustomerId DESC";
    const [rows] = await db.query(SQL);
    res.json({
      message: "Get customer success",
      list: rows,
    });
  } catch (error) {
    logError("Customer", error, res);
  }
};

const Create = async (req, res) => {
  try {
    const { CustomerName, Gender, Phone, Address } = req.body;

    if (!CustomerName || !CustomerName.trim()) {
      return res.status(400).json({ message: "CustomerName is required" });
    }

    const SQL = `
      INSERT INTO tblcustomer (CustomerName, Gender, Phone, Address)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(SQL, [
      CustomerName.trim(),
      Gender || "",
      Phone || "",
      Address || "",
    ]);

    res.status(201).json({
      message: "Customer created successfully",
      customer: {
        CustomerId: result.insertId,
        CustomerName: CustomerName.trim(),
        Gender: Gender || "",
        Phone: Phone || "",
        Address: Address || "",
      },
    });
  } catch (error) {
    logError("Customer", error, res);
  }
};

const Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const SQL = "DELETE FROM tblcustomer WHERE CustomerId = ?";
    const [result] = await db.query(SQL, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      message: "Customer deleted success",
      deleted: result.affectedRows,
      id,
    });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "មិនអាចលុបបានទេ ព្រោះអតិថិជននេះត្រូវបានប្រើរួចហើយ",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

const Update = async (req, res) => {
  try {
    const id = req.params.id;
    const { CustomerName, Gender, Phone, Address } = req.body;

    const SQL = `
      UPDATE tblcustomer
      SET CustomerName = ?, Gender = ?, Phone = ?, Address = ?
      WHERE CustomerId = ?
    `;

    const [result] = await db.query(SQL, [
      CustomerName,
      Gender,
      Phone,
      Address,
      id,
    ]);

    res.json({
      message: "Customer updated success",
      updated: result.affectedRows,
      id,
    });
  } catch (error) {
    logError("Customer", error, res);
  }
};

module.exports = { GetList, Create, Delete, Update };