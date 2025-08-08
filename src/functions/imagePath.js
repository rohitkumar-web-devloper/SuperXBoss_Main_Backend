const fs = require('fs');
const path = require('path');

const imagePath = (folder, media) => {
  // Resolve path to uploads folder outside of src
  const folderPath = path.join(__dirname, '..', '..', 'uploads', folder);

  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Return the full image URL
  const src = `${process.env.BASE_URL_UPLOAD}/${folder}/${media}`;
  console.log(src, "src");

  return src;
};

module.exports = { imagePath };
