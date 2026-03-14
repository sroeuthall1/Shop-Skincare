// controllers/saleController.js
const { io } = require("../server");

const createSale = async (req, res) => {
  // ... save sale logic

  // 🔔 emit realtime notification
  io.emit("notification", {
    id: Date.now(),
    text: "មានការលក់ថ្មី",
    type: "sale",
    createdAt: new Date(),
  });

  res.json({ message: "Sale created" });
};

module.exports = { createSale };