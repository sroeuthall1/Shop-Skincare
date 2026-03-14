const db = require("../config/db");
const ok = (res, list) => res.json({ list });

// controllers/reportController.js
exports.saleDaily = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const SQL = `
      SELECT
        i.InvoiceId,
        CONCAT('INV', LPAD(i.InvoiceId, 6, '0')) AS InvoiceNo,
        DATE(i.InvoiceDate) AS SaleDate,
        COALESCE(c.CustomerName,'') AS CustomerName,
        COALESCE(SUM(d.SaleQty),0)  AS TotalQty,
        i.Subtotal AS SubTotal,
        i.Discount AS Discount,
        i.GrandTotal AS GrandTotal
      FROM tblinvoice i
      LEFT JOIN tblcustomer c ON c.CustomerId = i.CustomerId
      LEFT JOIN tblsale s ON s.InvoiceId = i.InvoiceId
      LEFT JOIN tblsaledetail d ON d.SaleId = s.SaleId
      WHERE DATE(i.InvoiceDate) = ?
      GROUP BY i.InvoiceId
      ORDER BY i.InvoiceDate DESC
    `;

    const [rows] = await db.query(SQL, [date]);
    res.json({ list: rows });
  } catch (err) {
    console.error("saleDaily error:", err);
    res.status(500).json({ message: "saleDaily failed" });
  }
};


exports.saleMonthly = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ message: "month is required" });

    const SQL = `
      SELECT
        DATE(i.InvoiceDate) AS SaleDate,
        COUNT(DISTINCT i.InvoiceId) AS InvoiceCount,
        COALESCE(SUM(d.SaleQty),0) AS TotalQty,
        SUM(i.Subtotal) AS SubTotal,
        SUM(i.Discount) AS Discount,
        SUM(i.GrandTotal) AS GrandTotal
      FROM tblinvoice i
      LEFT JOIN tblsale s ON s.InvoiceId = i.InvoiceId
      LEFT JOIN tblsaledetail d ON d.SaleId = s.SaleId
      WHERE DATE_FORMAT(i.InvoiceDate,'%Y-%m') = ?
      GROUP BY DATE(i.InvoiceDate)
      ORDER BY SaleDate DESC
    `;

    const [rows] = await db.query(SQL, [month]);
    res.json({ list: rows });
  } catch (err) {
    console.error("saleMonthly error:", err);
    res.status(500).json({ message: "saleMonthly failed" });
  }
};



exports.buyDaily = async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) return res.status(400).json({ message: "date is required" });

    const SQL = `
      SELECT
        p.PurchaseNo,
        DATE(p.PurchaseDate) AS BuyDate,
        COALESCE(p.SupplierName, '') AS SupplierName,
        COALESCE(p.TotalQty, 0) AS TotalQty,
        COALESCE(p.SubTotal, 0) AS SubTotal,
        COALESCE(p.Discount, 0) AS Discount,
        COALESCE(p.GrandTotal, 0) AS GrandTotal
      FROM tblpurchases p
      WHERE DATE(p.PurchaseDate) = ?
      ORDER BY p.PurchaseDate DESC
    `;
    const [rows] = await db.query(SQL, [date]);
    return ok(res, rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.buyMonthly = async (req, res) => {
  try {
    const month = req.query.month;
    if (!month) return res.status(400).json({ message: "month is required" });

    const SQL = `
      SELECT
        DATE(p.PurchaseDate) AS BuyDate,
        COUNT(*) AS PurchaseCount,
        COALESCE(SUM(p.TotalQty), 0) AS TotalQty,
        COALESCE(SUM(p.SubTotal), 0) AS SubTotal,
        COALESCE(SUM(p.Discount), 0) AS Discount,
        COALESCE(SUM(p.GrandTotal), 0) AS GrandTotal
      FROM tblpurchases p
      WHERE DATE_FORMAT(p.PurchaseDate, '%Y-%m') = ?
      GROUP BY DATE(p.PurchaseDate)
      ORDER BY BuyDate DESC
    `;
    const [rows] = await db.query(SQL, [month]);
    return ok(res, rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
