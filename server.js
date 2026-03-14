const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const dashboardController = require("./routes/dashboard");
const category = require("./routes/categoryRoutes");
const customer = require("./routes/customerRoutes");
const supplier = require("./routes/supplierRoutes");
const unit = require("./routes/unitRoutes");
const brand = require("./routes/brandRoutes");
const user = require("./routes/userRoutes");
const product = require("./routes/productRoutes");
const invoice = require("./routes/invoiceRoutes");
const purchase = require("./routes/purchaseRoute");
const discount = require("./routes/discountRoute");
const payment = require("./routes/paymentRoute");
const stockReport = require("./routes/stockReportRoute");
const report = require("./routes/reportRoute");
const reportBuy = require("./routes/reportbuyRoute");
const pos = require("./routes/posRoute");
const notificationRoute = require("./routes/notificationRoute");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.VITE_API_URL?.replace(":3000", ":5173") || "http://localhost:5173";

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Socket.io
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
dashboardController(app);
category(app);
customer(app);
supplier(app);
unit(app);
brand(app);
user(app);
product(app);
invoice(app);
purchase(app);
discount(app);
payment(app);
pos(app);
stockReport(app);
report(app);
notificationRoute(app);
reportBuy(app);

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});