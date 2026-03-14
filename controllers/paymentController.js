// controllers/paymentController.js
const db = require("../config/db");

const pay = async (req, res) => {
  const { invoiceId, received, method = "Cash", remark = null } = req.body;

  if (!invoiceId) return res.status(400).json({ message: "Missing invoiceId" });

  // ✅ must login
  const userId = req.user?.UserId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [invRows] = await conn.query(
      `SELECT InvoiceId, Status, GrandTotal
       FROM tblInvoice
       WHERE InvoiceId = ?
       LIMIT 1`,
      [invoiceId]
    );

    if (!invRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invRows[0];
    if (String(invoice.Status).toUpperCase() === "PAID") {
      await conn.rollback();
      return res.status(400).json({ message: "Invoice already PAID" });
    }

    const total = Number(invoice.GrandTotal || 0);
    const recv = Number(received ?? total);

    if (recv < total) {
      await conn.rollback();
      return res.status(400).json({ message: "Received not enough", total, received: recv });
    }

    const [saleRows] = await conn.query(
      "SELECT SaleId FROM tblSale WHERE InvoiceId = ? LIMIT 1",
      [invoiceId]
    );
    if (!saleRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Sale not found" });
    }
    const saleId = saleRows[0].SaleId;

    // ✅ payment records who received money
    await conn.query(
      `INSERT INTO tblPayment (InvoiceId, SaleId, UserId, PaymentDate, Amount, PaymentMethod, Remark)
       VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
      [invoiceId, saleId, userId, total, method, remark]
    );

    // Stock OUT
    const [details] = await conn.query(
      "SELECT ProductId, SaleQty FROM tblSaleDetail WHERE SaleId = ?",
      [saleId]
    );

    for (const d of details) {
      await conn.query(
        `INSERT INTO tblStock
         (ProductId, Qty, Stock_Type, Stock_Date, UserId, SaleId, InvoiceId, StockDetail)
         VALUES (?, ?, 'OUT', NOW(), ?, ?, ?, 'SALE OUT')`,
        [d.ProductId, d.SaleQty, userId, saleId, invoiceId]
      );
    }

    await conn.query(
      "UPDATE tblInvoice SET Status = 'PAID' WHERE InvoiceId = ?",
      [invoiceId]
    );

    await conn.commit();
    return res.json({
      message: "Paid successfully",
      invoiceId,
      saleId,
      total,
      received: recv,
      change: Number((recv - total).toFixed(2)),
      paidBy: userId, // ✅ optional return
    });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return res.status(500).json({ message: "Pay failed" });
  } finally {
    conn.release();
  }
};

module.exports = { pay };
