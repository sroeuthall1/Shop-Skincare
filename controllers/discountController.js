const db = require("../config/db");
const logError = require("../service/service");

const GetList = async (req, res) => {
  try {
    const SQL = `SELECT
        d.DiscountId,
        d.ProductId,
        p.ProductName,
        p.SalePrice,

        d.PriceType,
        d.DiscountType,
        d.DiscountValue,
        d.StartDate,
        d.EndDate,
        d.IsActive,

        CASE
            WHEN d.DiscountType = 'PERCENT'
            THEN ROUND(p.SalePrice - (p.SalePrice * d.DiscountValue / 100), 2)
            WHEN d.DiscountType = 'AMOUNT'
            THEN ROUND(p.SalePrice - d.DiscountValue, 2)
            ELSE p.SalePrice
        END AS FinalPrice,

        u.UserName AS DiscountCreatedBy

        FROM tbldiscount d
        LEFT JOIN tblproduct p ON p.ProductId = d.ProductId
        LEFT JOIN tbluser u ON u.UserId = d.CreatedBy

        ORDER BY d.DiscountId DESC;
    `;
    const [rows] = await db.query(SQL);
    res.json({
      message: "Get Discount success",
      list: rows,
    });
  } catch (error) {
    logError("Discount", error, res);
  }
};

const Create = async (req, res) => {
  try {
    let {
      ProductId,
      PriceType,
      DiscountType,
      DiscountValue,
      StartDate,
      EndDate,
      IsActive,
    } = req.body;

    const CreatedBy = req.user?.UserId || req.user?.id;

    // ===== Validation =====
    if (!ProductId || !PriceType || !DiscountType || !DiscountValue || !StartDate || !EndDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!CreatedBy) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number(DiscountValue) <= 0) {
      return res.status(400).json({ message: "DiscountValue must be greater than 0" });
    }

    if (new Date(StartDate) >= new Date(EndDate)) {
      return res.status(400).json({ message: "StartDate must be before EndDate" });
    }

    const validPriceType = ["RETAIL", "WHOLESALE", "BOTH"];

    if (!validPriceType.includes(PriceType)) {
      return res.status(400).json({ message: "Invalid PriceType" });
    }

    if (IsActive === undefined) IsActive = 1;

    const SQL = `
      INSERT INTO tbldiscount
      (ProductId, PriceType, DiscountType, DiscountValue, StartDate, EndDate, IsActive, CreatedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(SQL, [
      ProductId,
      PriceType,
      DiscountType,
      DiscountValue,
      StartDate,
      EndDate,
      IsActive,
      CreatedBy,
    ]);

    res.status(201).json({
      message: "Discount created successfully",
      insertedId: result.insertId,
    });
  } catch (error) {
    logError("Discount", error, res);
  }
};

// ✅ UPDATE DISCOUNT
const Update = async (req, res) => {
  try {
    const { id } = req.params;

    let {
      ProductId,
      PriceType,
      DiscountType,
      DiscountValue,
      StartDate,
      EndDate,
      IsActive,
    } = req.body;

    // ===== Validation =====
    if (!id) return res.status(400).json({ message: "Missing id" });

    if (!ProductId || !PriceType || !DiscountType || !DiscountValue || !StartDate || !EndDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (Number(DiscountValue) <= 0) {
      return res.status(400).json({ message: "DiscountValue must be greater than 0" });
    }

    if (new Date(StartDate) >= new Date(EndDate)) {
      return res.status(400).json({ message: "StartDate must be before EndDate" });
    }

    const validPriceType = ["RETAIL", "WHOLESALE", "BOTH"];

    if (!validPriceType.includes(PriceType)) {
      return res.status(400).json({ message: "Invalid PriceType" });
    }

    if (IsActive === undefined) IsActive = 1;

    // check exist
    const [exist] = await db.query(
      "SELECT DiscountId FROM tbldiscount WHERE DiscountId = ?",
      [id]
    );
    if (exist.length === 0) {
      return res.status(404).json({ message: "Discount not found" });
    }

    const SQL = `
      UPDATE tbldiscount
      SET ProductId = ?, PriceType = ?, DiscountType = ?, DiscountValue = ?,
          StartDate = ?, EndDate = ?, IsActive = ?
      WHERE DiscountId = ?
    `;

    const [result] = await db.query(SQL, [
      ProductId,
      PriceType,
      DiscountType,
      DiscountValue,
      StartDate,
      EndDate,
      IsActive,
      id,
    ]);

    res.json({ message: "Discount updated successfully", affectedRows: result.affectedRows });
  } catch (error) {
    logError("Discount", error, res);
  }
};

// ✅ TOGGLE ACTIVE (Enable/Disable)
const ToggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { IsActive } = req.body; // 0 or 1

    if (!id) return res.status(400).json({ message: "Missing id" });

    if (IsActive !== 0 && IsActive !== 1 && IsActive !== "0" && IsActive !== "1") {
      return res.status(400).json({ message: "IsActive must be 0 or 1" });
    }

    const [exist] = await db.query(
      "SELECT DiscountId FROM tbldiscount WHERE DiscountId = ?",
      [id]
    );
    if (exist.length === 0) {
      return res.status(404).json({ message: "Discount not found" });
    }

    const SQL = `UPDATE tbldiscount SET IsActive = ? WHERE DiscountId = ?`;
    const [result] = await db.query(SQL, [Number(IsActive), id]);

    res.json({ message: "Status updated successfully", affectedRows: result.affectedRows });
  } catch (error) {
    logError("Discount", error, res);
  }
};

// ✅ DELETE DISCOUNT
const Delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Missing id" });
    }

    // Check exist
    const [exist] = await db.query(
      "SELECT DiscountId FROM tbldiscount WHERE DiscountId = ?",
      [id]
    );

    if (exist.length === 0) {
      return res.status(404).json({ message: "Discount not found" });
    }

    // Delete
    const [result] = await db.query(
      "DELETE FROM tbldiscount WHERE DiscountId = ?",
      [id]
    );

    res.json({
      message: "Discount deleted successfully",
      affectedRows: result.affectedRows
    });
  } catch (error) {
    logError("Discount", error, res);
  }
};


module.exports = { GetList, Create, Update, ToggleActive, Delete };
