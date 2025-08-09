const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /png|gif|mp4|mov|avi|mkv/;
    const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only image and video files are allowed!"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});


// const compressImage = async (req, res, next) => {
//     if (!req.file) return next();

//     const mime = req.file.mimetype;
//     if (mime.startsWith('image/')) {
//         try {
//             const compressed = await sharp(req.file.buffer)
//                 .resize({ width: 1080 }) // Resize width if needed
//                 .jpeg({ quality: 70 })   // Adjust quality
//                 .toBuffer();

//             req.file.buffer = compressed;
//         } catch (err) {
//             return next(new Error("Image compression failed"));
//         }
//     }
//     next();
// };
const compressImage = async (req, res, next) => {
    if (!req.file) return next();

    const mime = req.file.mimetype;
    if (!mime.startsWith('image/')) return next();

    try {
        const presets = {
            thumbnail: { width: 200, quality: 50 },
            small: { width: 480, quality: 60 },
            medium: { width: 720, quality: 70 },
            large: { width: 1080, quality: 70 },
            hd: { width: 1920, quality: 80 },
            retina: { width: 2560, quality: 85 },
        };

        const selected = presets['large']; // change this based on logic or request

        const compressed = await sharp(req.file.buffer)
            .resize({ width: selected.width })
            .jpeg({ quality: selected.quality })
            .toBuffer();

        req.file.buffer = compressed;
    } catch (err) {
        return next(new Error("Image compression failed"));
    }

    next();
};
module.exports = { upload, compressImage };