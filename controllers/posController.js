const db = require("../config/db");

exports.saveDraft = async (req, res) => {
  const { items = [], discount = 0, taxPercent = 0, customerId = null } = req.body;

  // ✅ seller from token
  const userId = req.user?.UserId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No items" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Create invoice draft (add CustomerId, UserId)
    const [inv] = await conn.query(
      `INSERT INTO tblInvoice (InvoiceDate, Status, CustomerId, UserId, Subtotal, Discount, GrandTotal)
       VALUES (NOW(), 'DRAFT', ?, ?, 0, ?, 0)`,
      [customerId || null, userId, Number(discount || 0)]
    );
    const invoiceId = inv.insertId;

    // 2) Create sale
    const [sale] = await conn.query(
      `INSERT INTO tblSale (InvoiceId, SaleDate)
       VALUES (?, NOW())`,
      [invoiceId]
    );
    const saleId = sale.insertId;

    // 3) Sale detail + subtotal
    let subTotal = 0;

    for (const it of items) {
      const qty = Number(it.qty || 0);
      const price = Number(it.salePrice || 0);

      if (qty <= 0) continue;

      const lineTotal = qty * price;
      subTotal += lineTotal;

      await conn.query(
        `INSERT INTO tblSaleDetail (SaleId, ProductId, SaleQty, SalePrice)
         VALUES (?, ?, ?, ?)`,
        [saleId, it.productId, qty, price]
      );
    }

    const discountNum = Number(discount || 0);
    const taxPct = Number(taxPercent || 0);
    const taxAmt = Math.max(0, subTotal - discountNum) * (taxPct / 100);
    const grandTotal = Math.max(0, subTotal - discountNum + taxAmt);

    // 4) Update invoice totals (optional: save tax too if you add columns later)
    await conn.query(
      `UPDATE tblInvoice
       SET Subtotal = ?, Discount = ?, GrandTotal = ?
       WHERE InvoiceId = ?`,
      [subTotal, discountNum, grandTotal, invoiceId]
    );

    await conn.commit();
    res.json({ message: "Saved (DRAFT)", invoiceId });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: "Save failed" });
  } finally {
    conn.release();
  }
};
