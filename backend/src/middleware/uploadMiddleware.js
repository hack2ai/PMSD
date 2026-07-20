const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =======================================
// Base Upload Folder
// =======================================
const UPLOAD_PATH = path.join(process.cwd(), "uploads");

console.log("📁 Upload Base Path:", UPLOAD_PATH);

// =======================================
// Create Upload Folders Automatically
// =======================================
const createFolder = (folderPath) => {

    console.log("📂 Checking Folder:", folderPath);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log("✅ Folder Created:", folderPath);
    } else {
        console.log("✅ Folder Already Exists:", folderPath);
    }

};

// =======================================
// Storage Configuration
// =======================================
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        console.log("================================");
        console.log("🚀 destination() CALLED");
        console.log("Field:", file.fieldname);
        console.log("Original Name:", file.originalname);
        console.log("Mime:", file.mimetype);

        let uploadFolder;

        switch (file.fieldname) {

            case "profile":
                uploadFolder = path.join(UPLOAD_PATH, "profiles");
                break;

            case "thumbnail":
                uploadFolder = path.join(UPLOAD_PATH, "courses");
                break;

            case "certificate":
                uploadFolder = path.join(UPLOAD_PATH, "certificates");
                break;

            default:
                uploadFolder = path.join(UPLOAD_PATH, "others");
                break;

        }

        createFolder(uploadFolder);

        console.log("📁 Saving To:");
        console.log(uploadFolder);
        console.log("================================");

        cb(null, uploadFolder);

    },

    filename: (req, file, cb) => {

        console.log("================================");
        console.log("🚀 filename() CALLED");

        const filename =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000000) +
            path.extname(file.originalname);

        console.log("Generated Filename:", filename);
        console.log("================================");

        cb(null, filename);

    }

});

// =======================================
// File Filter
// =======================================
const fileFilter = (req, file, cb) => {

    console.log("================================");
    console.log("🚀 fileFilter() CALLED");
    console.log("File:", file.originalname);
    console.log("Mime:", file.mimetype);

    const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf"
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {

        console.log("❌ Invalid File Type");

        return cb(
            new Error("Only JPG, JPEG, PNG and PDF files are allowed."),
            false
        );

    }

    console.log("✅ File Accepted");
    console.log("================================");

    cb(null, true);

};

// =======================================
// Upload Middleware
// =======================================
const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }

});

console.log("✅ Multer Middleware Loaded");

module.exports = upload;