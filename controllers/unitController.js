const db = require("../config/db");
const logError = require("../service/service");

const GetList = async (req, res) => {
    try {
        const SQL = "SELECT * FROM tblunit";
        const [rows] = await db.query(SQL);
        res.json({
            message: "Get unit success",
            list: rows,
        });
    } catch (error) {
        logError("Unit", error, res);
    }
};

const Create = async (req, res) => {
    try {
        const { UnitName, Description, Date } = req.body;
        const SQL = `INSERT INTO tblunit (UnitName, Description, Date) VALUES (?, ?, ?)`;
        const [result] = await db.query(SQL, [UnitName, Description, Date]);

        res.status(201).json({
            message: "Unit created successfully",
            insertedId: result.insertId,
            affectedRows: result.affectedRows,
            data: req.body
        });

    } catch (error) {
        logError("Unit", error, res);
    }
};

const Delete = async (req, res) => {
  try {
    const id = req.params.id;

    const SQL = "DELETE FROM tblunit WHERE UnitId = ?";
    const [result] = await db.query(SQL, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    return res.json({
      message: "Unit deleted success",
      deleted: result.affectedRows,
      id,
    });
  } catch (error) {
    // ✅ FK constraint: Unit ត្រូវបានប្រើក្នុង tblproduct ឬ table ផ្សេងៗ
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "មិនអាចលុបបានទេ ព្រោះឯកតានេះត្រូវបានប្រើរួចហើយ",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};


const Update = async (req, res) => {
    try {
        const id = req.params.id;
        const { UnitName, Description, Date } = req.body;
        const SQL = `UPDATE tblunit SET UnitName = ?, Description = ?, Date = ? WHERE UnitId = ?`;
        const [result] = await db.query(SQL, [UnitName, Description, Date, id]);
        res.json({
            message: "Unit updated success",
            updated: result.affectedRows,
            id: id,
            newData: { UnitName, Description, Date }
        });
    } catch (error) {
        logError("Unit", error, res);
    }
}


module.exports = {GetList,Create,Delete,Update};
