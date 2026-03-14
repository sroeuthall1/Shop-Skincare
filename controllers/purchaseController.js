const db = require("../config/db");
const logError = require("../service/service");

// =====================
// GET LIST
// =====================
const GetList = async (req, res) => {
  try {
    const SQL = `
      SELECT
        pu.PurchaseId,
        pu.ProductId,
        pu.SupplierId,
        pu.PurchaseQty,
        pu.Price,
        pu.PurchaseDate,

        pr.ProductName,
        s.SupplierName,
        us.UserName AS CreatedByUserName

      FROM tblPurchases pu
      LEFT JOIN tblProduct pr ON pu.ProductId = pr.ProductId
      LEFT JOIN tblSupplier s ON pu.SupplierId = s.SupplierId
      LEFT JOIN tbluser us ON us.UserId = pu.CreatedBy
      ORDER BY pu.PurchaseId DESC
    `;

    const [rows] = await db.query(SQL);
    res.json({ message: "Get Purchase success", list: rows });
  } catch (error) {
    logError("Purchases", error, res);
  }
};

// =====================
// CREATE (Purchase + Stock IN)  ✅ NO DUPLICATE STOCK
// =====================
const Create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { ProductId, SupplierId, PurchaseQty, Price, PurchaseDate } = req.body;

    if (!ProductId || !SupplierId || !PurchaseQty || !Price || !PurchaseDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const CreatedBy = req.user?.UserId ?? req.user?.id ?? null;

    await conn.beginTransaction();

    // 1) insert purchase
    const SQL1 = `
      INSERT INTO tblPurchases
        (ProductId, SupplierId, PurchaseQty, Price, PurchaseDate, CreatedBy)
      VALUES
        (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await conn.query(SQL1, [
      ProductId,
      SupplierId,
      PurchaseQty,
      Price,
      PurchaseDate,
      CreatedBy,
    ]);

    const purchaseId = result.insertId;

    // 2) UPSERT stock IN by PurchaseId (avoid duplicate)
    // check exist
    const [exist] = await conn.query(
      `SELECT StockId FROM tblStock WHERE PurchaseId = ? AND Stock_Type = 'IN' LIMIT 1`,
      [purchaseId]
    );

    if (exist.length > 0) {
      // update existing (safe if API called twice)
      await conn.query(
        `
        UPDATE tblStock
        SET
          ProductId = ?,
          Qty = ?,
          Stock_Date = ?,
          UserId = ?,
          StockDetail = 'PURCHASE IN'
        WHERE PurchaseId = ? AND Stock_Type = 'IN'
        `,
        [ProductId, PurchaseQty, PurchaseDate, CreatedBy, purchaseId]
      );
    } else {
      // insert new
      await conn.query(
        `
        INSERT INTO tblStock
          (ProductId, Qty, Stock_Type, Stock_Date, UserId, PurchaseId, StockDetail)
        VALUES
          (?, ?, 'IN', ?, ?, ?, 'PURCHASE IN')
        `,
        [ProductId, PurchaseQty, PurchaseDate, CreatedBy, purchaseId]
      );
    }

    await conn.commit();

    res.status(201).json({
      message: "Purchase created successfully + Stock IN (no duplicate)",
      insertedId: purchaseId,
    });
  } catch (error) {
    await conn.rollback();
    logError("Purchase", error, res);
  } finally {
    conn.release();
  }
};

// =====================
// UPDATE (Purchase + Stock IN) ✅ ALSO SAFE
// =====================
const Update = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const { ProductId, SupplierId, PurchaseQty, Price, PurchaseDate } = req.body;

    if (!id) return res.status(400).json({ message: "Missing PurchaseId" });
    if (!ProductId || !SupplierId || !PurchaseQty || !Price || !PurchaseDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const CreatedBy = req.user?.UserId ?? req.user?.id ?? null;

    await conn.beginTransaction();

    // 1) update purchase
    const SQL1 = `
      UPDATE tblPurchases
      SET 
        ProductId = ?,
        SupplierId = ?,
        PurchaseQty = ?,
        Price = ?,
        PurchaseDate = ?,
        CreatedBy = ?
      WHERE PurchaseId = ?
    `;

    const [result] = await conn.query(SQL1, [
      ProductId,
      SupplierId,
      PurchaseQty,
      Price,
      PurchaseDate,
      CreatedBy,
      id,
    ]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Purchase not found" });
    }

    // 2) ensure exactly 1 stock IN row for this purchase
    const [st] = await conn.query(
      `
      UPDATE tblStock
      SET
        ProductId = ?,
        Qty = ?,
        Stock_Date = ?,
        UserId = ?,
        Stock_Type = 'IN',
        StockDetail = 'PURCHASE IN'
      WHERE PurchaseId = ? AND Stock_Type = 'IN'
      `,
      [ProductId, PurchaseQty, PurchaseDate, CreatedBy, id]
    );

    if (st.affectedRows === 0) {
      await conn.query(
        `
        INSERT INTO tblStock
          (ProductId, Qty, Stock_Type, Stock_Date, UserId, PurchaseId, StockDetail)
        VALUES
          (?, ?, 'IN', ?, ?, ?, 'PURCHASE IN')
        `,
        [ProductId, PurchaseQty, PurchaseDate, CreatedBy, id]
      );
    } else {
      // if duplicates existed from old data, keep only 1 (optional cleanup)
      // delete extras leaving the newest one
      await conn.query(
        `
        DELETE FROM tblStock
        WHERE PurchaseId = ? AND Stock_Type = 'IN'
          AND StockId NOT IN (
            SELECT x.StockId FROM (
              SELECT StockId FROM tblStock
              WHERE PurchaseId = ? AND Stock_Type = 'IN'
              ORDER BY StockId DESC
              LIMIT 1
            ) x
          )
        `,
        [id, id]
      );
    }

    await conn.commit();

    res.json({
      message: "Purchase updated successfully + Stock IN synced (no duplicate)",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    await conn.rollback();
    logError("Purchase", error, res);
  } finally {
    conn.release();
  }
};

// =====================
// DELETE (Purchase + Stock IN)
// =====================
const Delete = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing PurchaseId" });

    await conn.beginTransaction();

    await conn.query(
      `DELETE FROM tblStock WHERE PurchaseId = ? AND Stock_Type = 'IN'`,
      [id]
    );

    const [result] = await conn.query(
      `DELETE FROM tblPurchases WHERE PurchaseId = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Purchase not found" });
    }

    await conn.commit();
    res.json({ message: "Purchase deleted successfully + Stock IN deleted", id });
  } catch (error) {
    await conn.rollback();
    logError("Purchase", error, res);
  } finally {
    conn.release();
  }
};

module.exports = { GetList, Create, Update, Delete };