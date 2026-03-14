const multer = require("multer");
const path = require("path");
const fs = require("fs");

// correct upload directory
const uploadDir = path.join(process.cwd(), "uploads", "products");

// auto create folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, filename);
  }
});

const uploadProductPhoto = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"), false);
    }
  }
});

module.exports = uploadProductPhoto;
