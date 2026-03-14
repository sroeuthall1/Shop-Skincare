// controllers/dashboardController.js
const db = require("../config/db");

exports.getSummary = async (req, res) => {
  try {
    const lowThreshold = Number(req.query.lowThreshold || 10);

    // ✅ One query returns everything needed by frontend
    const SQL = `
      SELECT
        -- ===== SALES TODAY / YESTERDAY (PAID only) =====
        COALESCE((
          SELECT SUM(i.GrandTotal)
          FROM tblinvoice i
          WHERE UPPER(i.Status) = 'PAID'
            AND DATE(i.InvoiceDate) = CURDATE()
        ), 0) AS sales_today,

        COALESCE((
          SELECT SUM(i.GrandTotal)
          FROM tblinvoice i
          WHERE UPPER(i.Status) = 'PAID'
            AND DATE(i.InvoiceDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ), 0) AS sales_yesterday,

        -- ===== ORDERS TODAY / YESTERDAY (PAID only) =====
        COALESCE((
          SELECT COUNT(*)
          FROM tblinvoice i
          WHERE UPPER(i.Status) = 'PAID'
            AND DATE(i.InvoiceDate) = CURDATE()
        ), 0) AS orders_today,

        COALESCE((
          SELECT COUNT(*)
          FROM tblinvoice i
          WHERE UPPER(i.Status) = 'PAID'
            AND DATE(i.InvoiceDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ), 0) AS orders_yesterday,

        -- ===== STOCK SUMMARY (Active products only) =====
        COALESCE(SUM(CASE WHEN s.stock_qty = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock,
        COALESCE(SUM(CASE WHEN s.stock_qty > 0 AND s.stock_qty <= ? THEN 1 ELSE 0 END), 0) AS low_stock

      FROM (
        SELECT
          p.ProductId,
          GREATEST(
            COALESCE(SUM(CASE
              WHEN st.Stock_Type='IN' THEN st.Qty
              WHEN st.Stock_Type='OUT' THEN -st.Qty
              ELSE 0
            END), 0),
            0
          ) AS stock_qty
        FROM tblproduct p
        LEFT JOIN tblstock st ON st.ProductId = p.ProductId
        WHERE p.Status = 1
        GROUP BY p.ProductId
      ) s
    `;

    const [rows] = await db.query(SQL, [lowThreshold]);
    const r = rows[0] || {};

    const salesToday = Number(r.sales_today || 0);
    const salesYesterday = Number(r.sales_yesterday || 0);
    const ordersToday = Number(r.orders_today || 0);
    const ordersYesterday = Number(r.orders_yesterday || 0);

    // ✅ percent change vs yesterday
    const calcPct = (today, yesterday) => {
      // yesterday=0 then avoid divide by 0
      if (yesterday <= 0) return today > 0 ? 100 : 0;
      return ((today - yesterday) / yesterday) * 100;
    };

    return res.json({
      sales: {
        today: salesToday,
        yesterday: salesYesterday,
        changePct: calcPct(salesToday, salesYesterday),
      },
      orders: {
        today: ordersToday,
        yesterday: ordersYesterday,
        changePct: calcPct(ordersToday, ordersYesterday),
      },
      stock: {
        lowThreshold,
        low: Number(r.low_stock || 0),
        out: Number(r.out_of_stock || 0),
      },
    });
  } catch (err) {
    console.error("dashboard getSummary error:", err);
    res.status(500).json({ message: "dashboard summary failed" });
  }
};
