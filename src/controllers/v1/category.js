const { default: mongoose } = require("mongoose");
const { error, success, parseBool } = require("../../functions/functions");
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");
const { CategoryModal } = require("../../schemas/categories");
const { createCategorySchema, updateCategorySchema } = require("../../Validation/category");
const { BrandCategoriesModel } = require("../../schemas/brands-categories");

const createCategory = async (_req, _res) => {
    try {
        if (!_req?.body) {
            return _res.status(400).json(error(400, "Category Body is required."));
        }
        const { _id } = _req.user
        const { originalname, buffer } = _req?.file || {};
        const { error: newError } = createCategorySchema.validate({ ..._req.body });
        if (newError) {
            console.log(newError);

            return _res.status(400).json(error(400, newError.details[0].message));
        }
        const {
            name,
            description,
            parent,
            featured,
            status,
        } = _req.body;
        const check = await CategoryModal.findOne({ name })
        if (check) {
            return _res.status(400).json(error(400, `${name} category already exist. `));
        }
        let category = new CategoryModal({
            name,
            description,
            featured,
            status,
            user: _id,
            createdBy: _id
        });
        if (originalname && buffer) {
            category.picture = await imageUpload(originalname, buffer, 'category')
        }
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
const updateCategory = async (_req, _res) => {
    try {
        if (!_req?.body) {
            return _res.status(400).json(error(400, "Category Body is required."));
        }
        const { id } = _req.params;
        const { _id: userId } = _req.user;
        const { originalname, buffer } = _req?.file || {};

        // Validate request body
        const { error: validationError } = updateCategorySchema.validate({ ..._req.body });
        if (validationError) {
            return _res.status(400).json(error(400, validationError.details[0].message));
        }

        const {
            name,
            description,
            parent,
            featured,
            status
        } = _req.body;
        const existingCategory = await CategoryModal.findById(id);
        if (!existingCategory) {
            return _res.status(404).json(error(404, "Category not found."));
        }

        const duplicate = await CategoryModal.findOne({ name, _id: { $ne: id } });
        if (duplicate) {
            return _res.status(400).json(error(400, `${name} category already exists.`));
        }
        existingCategory.name = name;
        existingCategory.description = description;
        existingCategory.featured = featured;
        existingCategory.status = status;
        existingCategory.updatedBy = userId;
        if (parent) {
            existingCategory.parent = parent;
        }
        if (originalname && buffer) {
            if (_req.file) {
                unlinkOldFile(existingCategory.picture)
            }
            existingCategory.picture = await imageUpload(originalname, buffer, 'category');
        }

        const updatedCategory = await existingCategory.save();

        return _res.status(200).json(success(updatedCategory));
    } catch (err) {
        console.error("Error updating category:", err);
        return _res.status(500).json(error(500, err.message));
    }
};
const getCategories = async (_req, _res) => {
    try {
        const { parent, active, pagination = "true", featured } = _req.query || {}
        const usePagination = pagination === "true";
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";
        const matchStage = {};
        const { _id, type } = _req.user
        const hasUser = type == "customer" ? mongoose.Types.ObjectId.isValid(_id) : false

        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: "i" } }
            ]
        }
        const booleanFilters = {
            status: parseBool(active),
            featured: parseBool(featured),
        };
        for (const [key, value] of Object.entries(booleanFilters)) {
            if (value !== undefined) {
                matchStage[key] = value;
            }
        }

        if (parent) {
            matchStage.parent = new mongoose.Types.ObjectId(parent);
        } else {
            matchStage.parent = null
        }

        const aggregationPipeline = [
            { $match: matchStage },
            ...(!hasUser ? [{
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                    pipeline: [
                        { $project: { name: 1, _id: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true
                }
            }] : []),
            ...(!hasUser ? [{
                $lookup: {
                    from: "users",
                    localField: "updatedBy",
                    foreignField: "_id",
                    as: "updatedBy",
                    pipeline: [
                        { $project: { name: 1, _id: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$updatedBy",
                    preserveNullAndEmptyArrays: true
                }
            }] : []),
            {
                $facet: {
                    data: [
                        { $sort: { createdAt: -1 } },
                        ...(usePagination ? [{ $skip: skip }, { $limit: limit }] : [])
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await CategoryModal.aggregate(aggregationPipeline);

        const category = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return _res.status(200).json(success(
            category, "Success",
            {
                total,
                page: usePagination ? page : 1,
                limit: usePagination ? limit : total,
                totalPages: usePagination ? Math.ceil(total / limit) : 1,
            }
        ));


    } catch (error) {
        return _req.status(500).json({ success: false, message: error.message });
    }
};




module.exports = { createCategory, updateCategory, getCategories } 