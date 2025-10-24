const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads folder if not exist
const uploadDir = path.join(__dirname, "../uploads/profile");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${req.user._id}-${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, or PNG images allowed!"));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
