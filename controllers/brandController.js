const db = require("../config/db");
const logError = require("../service/service");

// GET /brand
const GetList = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.BrandId,
        b.BrandName,
        b.CategoryId,
        c.CategoryName,
        b.Description,
        b.Date
      FROM tblBrand b
      LEFT JOIN tblCategory c ON c.CategoryId = b.CategoryId
      ORDER BY b.BrandId DESC
    `);

    res.json({ list: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// POST /brand/create
const Create = async (req, res) => {
  try {
    const { BrandName, CategoryId, Description, Date } = req.body;

    if (!BrandName || !CategoryId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO tblBrand (BrandName, CategoryId, Description, Date)
       VALUES (?, ?, ?, ?)`,
      [
        BrandName,
        Number(CategoryId),
        Description,
        Date ? Date : null, // ⭐ ""/undefined -> null
      ]
    );

    res.json({ message: "Created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const Delete = async (req, res) => {
  try {
    const { id } = req.params;

    const SQL = "DELETE FROM tblbrand WHERE BrandId = ?";
    const [result] = await db.query(SQL, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Brand not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
      id,
    });

  } catch (error) {
    // ✅ Brand ត្រូវបានប្រើក្នុង tblproduct ឬ table ផ្សេងៗ
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "មិនអាចលុបបានទេ ព្រោះម៉ាកនេះត្រូវបានប្រើរួចហើយ",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};


// PUT /brand/update/:id
const Update = async (req, res) => {
  try {
    const { id } = req.params;
    const { BrandName, CategoryId, Description, Date } = req.body;

    if (!BrandName || !CategoryId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await db.query(
      `UPDATE tblBrand
       SET BrandName=?, CategoryId=?, Description=?, Date=?
       WHERE BrandId=?`,
      [
        BrandName,
        Number(CategoryId),
        Description,
        Date ? Date : null, // ⭐ null allowed
        id,
      ]
    );

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {GetList,Create,Delete,Update};


