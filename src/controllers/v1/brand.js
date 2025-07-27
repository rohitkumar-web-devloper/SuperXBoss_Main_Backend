const { error, success, parseBool } = require("../../functions/functions");
const { BrandModel } = require("../../schemas/brands");
const { brandSchema, updateBrandSchema } = require("../../Validation/brand");
const { imageUpload } = require("../../functions/imageUpload");
const { BrandCategoriesModel } = require("../../schemas/brands-categories");

const createBrand = async (_req, _res) => {
    try {
        const { _id } = _req.user;
        const { originalname, buffer } = _req.file;

        const { error: customError, value } = brandSchema.validate(
            { ..._req.body },
            { abortEarly: false }
        );
        if (customError) {
            return _res.status(400).json(error(400, customError.details[0]?.message));
        }
        const existing = await BrandModel.findOne({
            name: { $regex: `^${value.name}$`, $options: 'i' }
        });

        if (existing) {
            return _res.status(409).json(error(400, 'Brand with this name already exists'));
        }

        const { name, description, type, brand_day, brand_segment, status, categories } = value

        const brand = new BrandModel({
            name,
            description,
            type,
            brand_day,
            brand_segment,
            status,
            createdBy: _id
        });
        if (buffer && originalname) {
            brand.logo = await imageUpload(originalname, buffer, "brand");
        }
        if (categories && categories?.length) {
            let data = []
            categories.forEach((it) => {
                data.push({ brand_id: brand._id, categories: it })
            })
            await BrandCategoriesModel.insertMany(data)
        }

        const saveBrand = await brand.save();
        const { createdAt, updatedAt, ...rest } = saveBrand.toObject();

        return _res.status(201).json(success(rest, 'Brand created successfully'));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};


const updateBrand = async (_req, _res) => {
    try {
        const { _id, } = _req.user;
        const { id } = _req.params;
        const { error: customError, value } = updateBrandSchema.validate(_req.body, { abortEarly: false });
        if (customError) {
            return _res.status(400).json(error(400, customError.details[0]?.message));
        }

        //  Find brand
        const brand = await BrandModel.findById(id);
        if (!brand) {
            return _res.status(404).json(error(404, 'Brand not found'));
        }

        //  Check for duplicate name (excluding itself)
        const existing = await BrandModel.findOne({
            name: { $regex: `^${value.name}$`, $options: 'i' },
            _id: { $ne: id }
        });
        if (existing) {
            return _res.status(409).json(error(409, 'Another brand with this name already exists'));
        }

        let updatedLogo = brand.logo;
        if (_req.file && _req.file.buffer) {
            if (brand.logo) {
                unlinkOldFile(brand.logo);
            }
            updatedLogo = await imageUpload(_req.file.originalname, _req.file.buffer, 'brand');
        }
        if (value?.categories && value?.categories?.length) {
            await BrandCategoriesModel.deleteMany({ brand_id: id })
            let data = []
            value.categories.forEach((it) => {
                data.push({ brand_id: id, categories: it })
            })
            await BrandCategoriesModel.insertMany(data)
        }
        delete value.categories
        const updatedData = {
            ...value,
            logo: updatedLogo,
            updatedBy: _id
        };

        const updatedBrand = await BrandModel.findByIdAndUpdate(id, updatedData, { new: true });

        const { createdAt, updatedAt, ...rest } = updatedBrand.toObject();
        return _res.status(200).json(success(rest, 'Brand updated successfully'));
    } catch (err) {
        console.error('Update Brand Error:', err);
        return _res.status(500).json(error(500, err.message));
    }
};

const getBrands = async (_req, _res) => {
    try {
        const { active, pagination = "true", type } = _req.query || {}
        const usePagination = pagination === "true";
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";

        const matchStage = {};
        const matchType = {};

        if (type) {
            matchType["brand_type.name"] = type?.trim();
        }
        if (search) {
            matchStage.name = { $regex: search, $options: "i" };
        }

        const booleanFilters = {
            status: parseBool(active),
        };
        for (const [key, value] of Object.entries(booleanFilters)) {
            if (value !== undefined) {
                matchStage[key] = value;
            }
        }

        const aggregationPipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "vehicle_segment_types",
                    localField: "brand_segment",
                    foreignField: "_id",
                    as: "brand_segment"
                }
            },


            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy"
                }
            },
            {
                $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "updatedBy",
                    foreignField: "_id",
                    as: "updatedBy"
                }
            },
            {
                $unwind: {
                    path: "$updatedBy",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Project sensitive user fields out
            {
                $project: {
                    "createdBy.access_token": 0,
                    "createdBy.password": 0,
                    "createdBy.createdAt": 0,
                    "createdBy.updatedAt": 0,
                    "createdBy.role": 0,
                    "createdBy.type": 0,
                    "createdBy.status": 0,
                    "updatedBy.access_token": 0,
                    "updatedBy.password": 0,
                    "updatedBy.createdAt": 0,
                    "updatedBy.updatedAt": 0,
                    "updatedBy.role": 0,
                    "updatedBy.type": 0,
                    "updatedBy.status": 0
                }
            },

            // Lookup brand categories
            {
                $lookup: {
                    from: "brands_categories",
                    localField: "_id",
                    foreignField: "brand_id",
                    as: "brand_categories"
                }
            },
            {
                $unwind: {
                    path: "$brand_categories",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup categories
            {
                $lookup: {
                    from: "categories",
                    localField: "brand_categories.categories",
                    foreignField: "_id",
                    as: "categories"
                }
            },

            // Final grouping to deduplicate and collect required fields
            {
                $lookup: {
                    from: "brand_types",
                    localField: "type",
                    foreignField: "_id",
                    as: "brand_type"
                }
            },
            {
                $unwind: {
                    path: "$brand_type",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    logo: { $first: "$logo" },
                    description: { $first: "$description" },
                    type: { $first: "$type" },
                    brand_day: { $first: "$brand_day" },
                    brand_day_offer: { $first: "$brand_day_offer" },
                    brand_segment: { $first: "$brand_segment" },
                    sorting: { $first: "$sorting" },
                    status: { $first: "$status" },
                    updatedAt: { $first: "$updatedAt" },
                    createdAt: { $first: "$createdAt" },
                    updatedBy: { $first: "$updatedBy" },
                    createdBy: { $first: "$createdBy" },
                    brand_type: { $first: "$brand_type" },
                    categories: { $push: "$categories" }
                }
            },

            {
                $match: matchType
            },
            {
                $addFields: {
                    categories: {
                        $reduce: {
                            input: "$categories",
                            initialValue: [],
                            in: { $setUnion: ["$$value", "$$this"] }
                        }
                    }
                }
            },

            // Pagination and sorting
            { $sort: { createdAt: -1 } },
            ...(usePagination ? [{ $skip: skip }, { $limit: limit }] : []),

            {
                $facet: {
                    data: [
                        // All transformation above already included
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];


        const result = await BrandModel.aggregate(aggregationPipeline);

        const brands = result[0].data;

        const total = result[0].totalCount[0]?.count || 0;

        return _res.status(200).json(
            success(brands, "Brands fetched successfully",
                {
                    total,
                    page: usePagination ? page : 1,
                    limit: usePagination ? limit : total,
                    totalPages: usePagination ? Math.ceil(total / limit) : 1,
                }

            )
        );

    } catch (error) {
        return _res.status(500).json({ success: false, message: error.message });
    }
};
const getBrandsWithVehicle = async (_req, _res) => {
    try {
        const { active, pagination = "true", type } = _req.query || {}
        const usePagination = pagination === "true";
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";

        const matchStage = {};
        const matchType = {};

        if (type) {
            matchType["brand_type.name"] = type?.trim();
        }
        if (search) {
            matchStage.name = { $regex: search, $options: "i" };
        }

        const booleanFilters = {
            status: parseBool(active),
        };
        for (const [key, value] of Object.entries(booleanFilters)) {
            if (value !== undefined) {
                matchStage[key] = value;
            }
        }

        const aggregationPipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "brand_types",
                    localField: "type",
                    foreignField: "_id",
                    as: "brand_type"
                }
            },
            {
                $unwind: {
                    path: "$brand_type",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "_id",
                    foreignField: "brand_id",
                    as: "vehicles"
                }
            },
            {
                $match: matchType
            },
            // Pagination and sorting
            { $sort: { createdAt: -1 } },
            ...(usePagination ? [{ $skip: skip }, { $limit: limit }] : []),

            {
                $facet: {
                    data: [
                        // All transformation above already included
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];


        const result = await BrandModel.aggregate(aggregationPipeline);

        const brands = result[0].data;

        const total = result[0].totalCount[0]?.count || 0;

        return _res.status(200).json(
            success(brands, "Brands fetched successfully",
                {
                    total,
                    page: usePagination ? page : 1,
                    limit: usePagination ? limit : total,
                    totalPages: usePagination ? Math.ceil(total / limit) : 1,
                }

            )
        );

    } catch (error) {
        return _res.status(500).json({ success: false, message: error.message });
    }
};
const getActiveBrands = async (_req, _res) => {
    try {
        const result = await BrandModel.find({ status: true }).select({ createdAt: 0, updatedAt: 0, brand_segment: 0, brand_day_offer: 0, sorting: 0 });
        return _res.status(200).json(success(result, "Brands fetched successfully")
        );

    } catch (error) {
        return _res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = { createBrand, updateBrand, getBrands, getActiveBrands, getBrandsWithVehicle }