const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base upload directory
const baseUploadPath = path.join(__dirname, '../../uploads');

// Ensure folder exists
const ensureDirExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Configure storage with dynamic folder name from req.body.folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = req.body.folder || 'default'; // fallback if not provided

        // ✅ Sanitize folder name (remove slashes, dots, etc.)
        folder = folder.replace(/[^a-zA-Z0-9_-]/g, '');

        const finalPath = path.join(baseUploadPath, folder);
        ensureDirExists(finalPath);
        cb(null, finalPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
        cb(null, uniqueName);
    }
});

// Filter allowed files (images/videos)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only image and video files are allowed!"));
    }
};

// Final multer upload
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

module.exports = { upload, baseUploadPath };
