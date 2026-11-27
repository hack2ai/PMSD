const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPG, JPEG, PNG and PDF files are allowed."), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;