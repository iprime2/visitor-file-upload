const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const date = String(new Date().getDate()).padStart(2, "0");
    const uploadDir = path.join("uploads", year.toString(), month, date);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const visitorId = req.params.visitorId;
    cb(null, visitorId + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
  fileFilter: function (req, file, cb) {
    // Only allow certain file types
    const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only images, PDF, and Word documents are allowed (jpeg, jpg, png, gif, pdf, doc, docx)."
        )
      );
    }
  },
});

app.get("/", (req, res) => {
  res.status(200).send("Server is running on port 3030");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No files were uploaded.");
  }

  const filePath = req.file.path;
  const filename = req.file.originalname;
  const systemPath = process.cwd();
  const fullPath = path.join(systemPath, filePath);

  res.status(200).json({
    message: "File uploaded successfully.",
    filename: filename,
    fullPath: fullPath,
  });
});

app.get("/download", (req, res) => {
  const filePath = req.query.filePath;

  if (!filePath) {
    return res.status(400).send("File path is missing");
  }

  if (fs.existsSync(filePath)) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${path.basename(filePath)}`
    );
    res.sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).send("File upload error: " + err.message);
  } else {
    res.status(500).send("Internal server error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT || 3111, () => {
  console.log(`Server is running on port ${PORT}`);
});
