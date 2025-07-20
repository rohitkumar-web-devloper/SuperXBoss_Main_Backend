const fs = require('fs');
const path = require('path');

const unlinkOldFile = (fileUrl) => {
    if (!fileUrl) return;

    try {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4004}`;
        const relativePath = fileUrl.replace(baseUrl, ''); // e.g., /uploads/user/filename.png
        const fullPath = path.join(__dirname, '../../', relativePath); // Adjust based on folder structure
        console.log(fullPath, "fullPath");


        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('✅ Old file deleted:', fullPath);
        } else {
            console.log('❌ File not found:', fullPath);
        }
    } catch (err) {
        console.error('Error deleting file:', err.message);
    }
};
module.exports = unlinkOldFile