const imagePath = (folder, media) => {
    const src = `${process.env.BASE_URL_UPLOAD}/${folder}/${media}`;
    return src
}
module.exports = { imagePath }