const { error, success } = require("../../functions/functions");
const { imagePath } = require("../../functions/imagePath");
const { CategoryModal } = require("../../schemas/categories");

const createCategory = async (_req, _res) => {
    try {
        const userId = _req.user
        const folder = _req.body.folder || 'default';
        const media = _req.file ? _req.file.filename : "";
        const src = imagePath(folder, media)
        const {
            name,
            description,
            parent,
            featured,
            status,
        } = _req.body;

        if (!name) {
            return _res.status(400).json(error(400, "Category name is required."));
        }
        let category = new CategoryModal({
            name,
            picture: src,
            description,
            featured,
            status,
            user: userId,
            createdBy: userId
        });
        if (parent) {
            category.parent = parent
        }
        const savedCategory = await category.save();
        return _res.status(201).json(success(savedCategory));

    } catch (error) {
        console.error("Error creating category:", error);
        return _res.status(500).json(error(500, error.message));
    }
}

module.exports = { createCategory } 