const db = require("../config/db");


// ✅ GET /reports/buy/daily?date=YYYY-MM-DD
exports.buyDaily = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date is required" });

    const SQL = `
      SELECT
        p.PurchaseId,
        CONCAT('PUR', LPAD(p.PurchaseId, 6, '0')) AS PurchaseNo,
        DATE(p.PurchaseDate) AS BuyDate,
        COALESCE(s.SupplierName,'') AS SupplierName,
        COALESCE(p.PurchaseQty,0) AS TotalQty,
        COALESCE(p.PurchaseQty * p.Price,0) AS SubTotal,
        0 AS Discount,
        COALESCE(p.PurchaseQty * p.Price,0) AS GrandTotal
      FROM tblpurchases p
      LEFT JOIN tblsupplier s ON s.SupplierId = p.SupplierId
      WHERE DATE(p.PurchaseDate) = ?
    `;

    const [rows] = await db.query(SQL, [date]);
    return ok(res, rows);
  } catch (err) {
    console.error("buyDaily error:", err);
    res.status(500).json({ message: "buyDaily failed" });
  }
};

// ✅ GET /reports/buy/monthly?month=YYYY-MM
exports.buyMonthly = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ message: "month is required" });

    console.log("✅ NEW buyMonthly running", month); // <-- ដាក់ confirm

    const SQL = `
      SELECT
        DATE(p.PurchaseDate) AS BuyDate,
        COUNT(*) AS PurchaseCount,
        COALESCE(SUM(p.PurchaseQty), 0) AS TotalQty,
        COALESCE(SUM(p.PurchaseQty * p.Price), 0) AS SubTotal,
        0 AS Discount,
        COALESCE(SUM(p.PurchaseQty * p.Price), 0) AS GrandTotal
      FROM tblpurchases p
      WHERE DATE_FORMAT(p.PurchaseDate, '%Y-%m') = ?
      GROUP BY DATE(p.PurchaseDate)
      ORDER BY BuyDate DESC
    `;

    const [rows] = await db.query(SQL, [month]);
    return ok(res, rows);
  } catch (err) {
    console.error("buyMonthly error:", err);
    res.status(500).json({ message: "buyMonthly failed" });
  }
};