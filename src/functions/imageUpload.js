const path = require("path");
const fs = require("fs");

const imageUpload = async (originalname, buffer, folder) => {
    const filename = `${Date.now()}-${originalname.replace(/\s+/g, "_")}`;
    const filePath = path.join(__dirname, `../../uploads/${folder}/${filename}`);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    // Construct public URL (use env or fallback)
    const baseUrl = process.env.BASE_URL_UPLOAD || `http://localhost:${process.env.PORT || 4004}`;
    console.log(baseUrl, "baseUrl");


    const publicUrl = `${baseUrl}/${folder}/${filename}`;

    return publicUrl;
};

// This should point to the absolute path where uploads will be stored
const baseUploadPath = path.join(__dirname, '../../uploads');


module.exports = { imageUpload, baseUploadPath };
