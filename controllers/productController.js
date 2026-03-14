const multer = require("multer");
const db = require("../config/db");
const logError = require("../service/service");
const fs = require("fs");
const path = require("path");

const GetList = async (req, res) => {
  try {
    const SQL = `
      SELECT
        p.ProductId,
        p.ProductName,
        p.Barcode,
        p.PurchasePrice,
        p.SalePrice,
        p.Status,
        p.ExpireDate,
        p.Photo,

        p.CategoryId,
        c.CategoryName,

        p.UnitId,
        u.UnitName,

        p.BrandId,
        b.BrandName,

        us.UserName AS CreatedByUserName,

        -- ✅ Stock left = IN - OUT
        COALESCE(SUM(
          CASE
            WHEN st.Stock_Type = 'IN'  THEN st.Qty
            WHEN st.Stock_Type = 'OUT' THEN -st.Qty
            ELSE 0
          END
        ), 0) AS StockQty

      FROM tblproduct p
      LEFT JOIN tblcategory c ON p.CategoryId = c.CategoryId
      LEFT JOIN tblunit u ON p.UnitId = u.UnitId
      LEFT JOIN tblbrand b ON p.BrandId = b.BrandId
      LEFT JOIN tbluser us ON us.UserId = p.CreatedBy
      LEFT JOIN tblstock st ON st.ProductId = p.ProductId

      GROUP BY
        p.ProductId,
        p.ProductName,
        p.Barcode,
        p.PurchasePrice,
        p.SalePrice,
        p.Status,
        p.ExpireDate,
        p.Photo,
        p.CategoryId,
        c.CategoryName,
        p.UnitId,
        u.UnitName,
        p.BrandId,
        b.BrandName,
        us.UserName

      ORDER BY p.ProductId DESC
    `;

    const [rows] = await db.query(SQL);

    res.json({ message: "Get Product success", list: rows });
  } catch (error) {
    logError("Product", error, res);
  }
};

const GetByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const [rows] = await db.query(
      `SELECT BrandId, BrandName, CategoryId
       FROM tblbrand
       WHERE CategoryId = ?
       ORDER BY BrandName ASC`,
      [categoryId]
    );

    res.json({ list: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Create = async (req, res) => {
  try {
    let {
      ProductName,
      Barcode,
      CategoryId,
      UnitId,
      BrandId,
      PurchasePrice,
      SalePrice,
      Status,
      ExpireDate,
    } = req.body;

    const CreatedBy = req.user?.UserId || req.user?.id;
    const Photo = req.file ? `uploads/products/${req.file.filename}` : null;

    // ✅ fix: Status can be undefined
    Status = Status === undefined || Status === "" ? 1 : Number(Status);

    const SQL = `
      INSERT INTO tblproduct
      (ProductName, Barcode, CategoryId, UnitId, BrandId, PurchasePrice, SalePrice, Status, ExpireDate, Photo, CreatedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(SQL, [
      ProductName,
      Barcode,
      CategoryId,
      UnitId,
      BrandId,
      PurchasePrice,
      SalePrice,
      Status,
      ExpireDate,
      Photo,
      CreatedBy,
    ]);

    res.status(201).json({
      message: "Product created successfully",
      insertedId: result.insertId,
    });
  } catch (error) {
    logError("Product", error, res);
  }
};

const Delete = async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      "SELECT Photo FROM tblproduct WHERE ProductId = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const photoPath = rows[0].Photo;

    await db.query("DELETE FROM tblproduct WHERE ProductId = ?", [id]);

    if (photoPath) {
      const fullPath = path.join(process.cwd(), photoPath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    res.json({ message: "Product + photo deleted successfully", id });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "មិនអាចលុបបានទេ ព្រោះផលិតផលនេះត្រូវបានប្រើរួចហើយ",
      });
    }
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

const Update = async (req, res) => {
  try {
    const id = req.params.id;

    let {
      ProductName,
      Barcode,
      CategoryId,
      UnitId,
      BrandId,
      PurchasePrice,
      SalePrice,
      Status,
      ExpireDate,
    } = req.body;

    const CreatedBy = req.user?.UserId || req.user?.id;

    const [rows] = await db.query(
      "SELECT Photo FROM tblproduct WHERE ProductId = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Product not found" });

    const oldPhoto = rows[0].Photo;
    const newPhoto = req.file ? `uploads/products/${req.file.filename}` : oldPhoto;

    // ✅ fix: Status can be undefined
    Status = Status === undefined || Status === "" ? 1 : Number(Status);

    const SQL = `
      UPDATE tblproduct
      SET ProductName=?, Barcode=?, CategoryId=?, UnitId=?, BrandId=?,
          PurchasePrice=?, SalePrice=?, Status=?, ExpireDate=?, Photo=?, CreatedBy=?
      WHERE ProductId=?
    `;

    const [result] = await db.query(SQL, [
      ProductName,
      Barcode,
      CategoryId,
      UnitId,
      BrandId,
      PurchasePrice,
      SalePrice,
      Status,
      ExpireDate,
      newPhoto,
      CreatedBy,
      id,
    ]);

    // delete old photo if replaced
    if (req.file && oldPhoto) {
      const fullOldPath = path.join(process.cwd(), oldPhoto);
      if (fs.existsSync(fullOldPath)) fs.unlinkSync(fullOldPath);
    }

    res.json({
      message: "Product updated successfully",
      affectedRows: result.affectedRows,
      id,
      Photo: newPhoto,
    });
  } catch (error) {
    logError("Product", error, res);
  }
};

const ToggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    if (!id) return res.status(400).json({ message: "Missing id" });

    const statusNum = Number(Status);
    if (![0, 1].includes(statusNum)) {
      return res.status(400).json({ message: "Status must be 0 or 1" });
    }

    const [exist] = await db.query(
      "SELECT ProductId FROM tblproduct WHERE ProductId = ?",
      [id]
    );
    if (exist.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const [result] = await db.query(
      `UPDATE tblproduct SET Status = ? WHERE ProductId = ?`,
      [statusNum, id]
    );

    res.json({
      message: "Status updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    logError("Product", error, res);
  }
};

module.exports = { GetList, Create, Delete, Update, GetByCategory, ToggleActive };
