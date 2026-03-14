// backend/controllers/stockReportController.js
const db = require("../config/db");

// GET /reports/stock/daily?date=2026-02-16
exports.daily = async (req, res) => {
  const date = req.query.date; // YYYY-MM-DD
  if (!date) return res.status(400).json({ message: "Missing date" });

  try {
    const [rows] = await db.query(
      `
      SELECT
        s.ProductId,
        p.ProductName,
        SUM(CASE WHEN s.Stock_Type='IN'  THEN s.Qty ELSE 0 END) AS InQty,
        SUM(CASE WHEN s.Stock_Type='OUT' THEN s.Qty ELSE 0 END) AS OutQty,
        SUM(CASE WHEN s.Stock_Type='IN'  THEN s.Qty ELSE -s.Qty END) AS NetQty
      FROM tblStock s
      JOIN tblProduct p ON p.ProductId = s.ProductId
      WHERE DATE(s.Stock_Date) = ?
      GROUP BY s.ProductId, p.ProductName
      ORDER BY p.ProductName
      `,
      [date]
    );

    res.json({ date, list: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Daily report failed" });
  }
};

// GET /reports/stock/monthly?month=2026-02
exports.monthly = async (req, res) => {
  const month = req.query.month; // YYYY-MM
  if (!month) return res.status(400).json({ message: "Missing month" });

  // monthStart = YYYY-MM-01, monthEnd = next month first day
  const monthStart = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const monthEnd = new Date(y, m, 1); // next month (JS month is 0-based but m already 1..12)
  const monthEndStr = monthEnd.toISOString().slice(0, 10);

  try {
    const [rows] = await db.query(
      `
      SELECT
        DATE(s.Stock_Date) AS TheDate,
        SUM(CASE WHEN s.Stock_Type='IN'  THEN s.Qty ELSE 0 END) AS InQty,
        SUM(CASE WHEN s.Stock_Type='OUT' THEN s.Qty ELSE 0 END) AS OutQty,
        SUM(CASE WHEN s.Stock_Type='IN'  THEN s.Qty ELSE -s.Qty END) AS NetQty
      FROM tblStock s
      WHERE s.Stock_Date >= ? AND s.Stock_Date < ?
      GROUP BY DATE(s.Stock_Date)
      ORDER BY TheDate
      `,
      [monthStart, monthEndStr]
    );

    res.json({ month, list: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Monthly report failed" });
  }
};

// GET /reports/stock/balance
exports.balance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        s.ProductId,
        p.ProductName,
        SUM(CASE WHEN s.Stock_Type='IN' THEN s.Qty ELSE -s.Qty END) AS BalanceQty
      FROM tblStock s
      JOIN tblProduct p ON p.ProductId = s.ProductId
      GROUP BY s.ProductId, p.ProductName
      ORDER BY p.ProductName
      `
    );

    res.json({ list: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Balance report failed" });
  }
};
