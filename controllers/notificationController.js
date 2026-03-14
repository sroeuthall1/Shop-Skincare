const db = require("../config/db");

const getExpiryNotifications = async (req, res) => {
  try {
    const soonDays = Number(req.query.soonDays || 7);

    const [expired] = await db.query(`
      SELECT ProductId, ProductName, ExpireDate
      FROM tblProduct
      WHERE ExpireDate IS NOT NULL AND ExpireDate < CURDATE()
    `);

    const [soon] = await db.query(
      `
      SELECT ProductId, ProductName, ExpireDate
      FROM tblProduct
      WHERE ExpireDate IS NOT NULL
        AND ExpireDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    `,
      [soonDays]
    );

    const notifications = [
      ...expired.map((p) => ({
        id: `expired-${p.ProductId}-${p.ExpireDate}`,
        type: "expired",
        text: `⚠️ ផលិតផលហួសកំណត់ \n ${p.ProductName} (${p.ExpireDate})`,
        read: false,
      })),
      ...soon.map((p) => ({
        id: `soon-${p.ProductId}-${p.ExpireDate}`,
        type: "expiring-soon",
        text: `⏳ ផលិតផលជិតហួស \n ${p.ProductName} (${p.ExpireDate})`,
        read: false,
      })),
    ];

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getExpiryNotifications };