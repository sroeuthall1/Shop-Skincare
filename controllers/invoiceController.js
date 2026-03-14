const db = require("../config/db");
const logError = require("../service/service");

const GetList = async (req, res) => {
    try {
        const SQL = "SELECT * FROM tblinvoice";
        const [rows] = await db.query(SQL);
        res.json({
            message: "Get Invoice success",
            list: rows,
        });
    } catch (error) {
        logError("Invoice", error, res);
    }
};

const GetById = async (req, res) => {
  try {
    const { id } = req.params;

    // HEADER (tblsale)
    const [headerRows] = await db.query(
      `SELECT
        s.SaleId,
        s.SaleDate,
        u.UserName AS CreatedByName,
        c.CustomerName
      FROM tblsale s
      LEFT JOIN tbluser u ON u.UserId = s.UserId
      LEFT JOIN tblcustomer c ON c.CustomerId = s.CustomerId
      WHERE s.SaleId = ?`,
      [id]
    );

    if (!headerRows.length) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // ITEMS (tblsaledetail)
    const [items] = await db.query(
      `SELECT
        d.SaleDetailId,
        d.ProductId,
        p.ProductName,
        d.SaleQty,
        d.SalePrice,
        d.DiscountAmount,
        d.Remark,
        (d.SaleQty * d.SalePrice) AS LineTotal
      FROM tblsaledetail d
      LEFT JOIN tblproduct p ON p.ProductId = d.ProductId
      WHERE d.SaleId = ?`,
      [id]
    );

    // PAYMENT (tblpayment)  ✅ use Amount
    const [payments] = await db.query(
      `SELECT
        SUM(Amount) AS PaidTotal,
        GROUP_CONCAT(PaymentMethod SEPARATOR ', ') AS Methods
      FROM tblpayment
      WHERE SaleId = ?`,
      [id]
    );

    const paidTotal = payments?.[0]?.PaidTotal || 0;
    const methods = payments?.[0]?.Methods || "Cash";

    return res.json({
      invoice: {
        ...headerRows[0],
        PaidTotal: paidTotal,
        PaymentMethods: methods
      },
      items
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const Create = async (req, res) => {
    try {
        const { InvoiceName } = req.body;
        const SQL = `INSERT INTO tblinvoice (InvoiceName) VALUES (?)`;
        const [result] = await db.query(SQL, [InvoiceName]);

        res.status(201).json({
            message: "Invoice created successfully",
            insertedId: result.insertId,
            affectedRows: result.affectedRows,
            data: req.body
        });

    } catch (error) {
        logError("Invoice", error, res);
    }
};


const Delete = async (req, res) => {
  try {
    const { id } = req.params;

    const SQL = "DELETE FROM tblinvoice WHERE InvoiceId = ?";
    const [result] = await db.query(SQL, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      id,
    });

  } catch (error) {
    logError("Invoice", error, res);
  }
};

const Update = async (req, res) => {
    try {
        const id = req.params.id;
        const { InvoiceName } = req.body;
        const SQL = `UPDATE tblinvoice SET InvoiceName = ? WHERE InvoiceId = ?`;
        const [result] = await db.query(SQL, [InvoiceName,id]);
        res.json({
            message: "Invoice updated success",
            updated: result.affectedRows,
            id: id,
            newData: { InvoiceName }
        });
    } catch (error) {
        logError("Invoice", error, res);
    }
}


module.exports = {GetList,Create,Delete,Update, GetById};


