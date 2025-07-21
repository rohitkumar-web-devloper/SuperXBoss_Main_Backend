const { error, success } = require("../../functions/functions");
const { BrandModel } = require("../../schemas/brands");
const { brandSchema, updateBrandSchema } = require("../../Validation/brand");
const { imageUpload } = require("../../functions/imageUpload");

const createBrand = async (_req, _res) => {
    try {
        const { _id } = _req.user;
        const { originalname, buffer } = _req.file;


        const { error: customError, value } = brandSchema.validate(
            { ..._req.body, logo: _req.file },
            { abortEarly: false }
        );
        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }
        const existing = await BrandModel.findOne({
            name: { $regex: `^${value.name}$`, $options: 'i' }
        });
        if (existing) {
            return _res.status(409).json(error(400, 'Brand with this name already exists'));
        }

        let file = '';
        if (buffer && originalname) {
            file = await imageUpload(originalname, buffer, "brand");
        }

        const brand = new BrandModel({
            ...value,
            logo: file,
            createdBy: _id
        });

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
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
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

const getBrands = async (_req, res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";

        const matchStage = search
            ? { name: { $regex: search, $options: "i" } }
            : {};

        const aggregationPipeline = [
            { $match: matchStage },

            // Lookup createdBy details
            {
                $lookup: {
                    from: "vehicle_segment_types",
                    localField: "brand_segment",
                    foreignField: "_id",
                    as: "brand_segment"
                }
            },
            {
                $unwind: {
                    path: "$brand_segment",
                    preserveNullAndEmptyArrays: true
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

            // Lookup updatedBy details
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
                    "updatedBy.status": 0,

                }
            },
            // Sorting and pagination
            { $sort: { sorting: 1 } },
            {
                $facet: {
                    data: [
                        {
                            $group: {
                                _id: "$_id",
                                name: { $first: "$name" },
                                logo: { $first: "$logo" },
                                description: { $first: "$description" },
                                type: { $first: "$type" },
                                brand_day: { $first: "$brand_day" },
                                brand_day_offer: { $first: "$brand_day_offer" },
                                brand_segment: { $push: "$brand_segment" },
                                sorting: { $first: "$sorting" },
                                status: { $first: "$status" },
                                updatedAt: { $first: "$updatedAt" },
                                createdAt: { $first: "$createdAt" },
                                updatedBy: { $first: "$updatedBy" },
                                createdBy: { $first: "$createdBy" },
                            }
                        },
                        { $skip: skip },
                        { $limit: limit },
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

        return res.status(200).json(
            success(brands, "Brands fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },

            )
        );

    } catch (error) {
        return _req.status(500).json({ success: false, message: error.message });
    }
};

const getActiveBrands = async (_req, res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";

        const matchStage = search
            ? { name: { $regex: search, $options: "i" } }
            : {};

        const aggregationPipeline = [
            { $match: matchStage },

            // Lookup createdBy details
            {
                $lookup: {
                    from: "vehicle_segment_types",
                    localField: "brand_segment",
                    foreignField: "_id",
                    as: "brand_segment"
                }
            },
            {
                $unwind: {
                    path: "$brand_segment",
                    preserveNullAndEmptyArrays: true
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

            // Lookup updatedBy details
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
                    "updatedBy.status": 0,

                }
            },
            // Sorting and pagination
            { $sort: { sorting: 1 } },
            {
                $facet: {
                    data: [
                        {
                            $group: {
                                _id: "$_id",
                                name: { $first: "$name" },
                                logo: { $first: "$logo" },
                                description: { $first: "$description" },
                                type: { $first: "$type" },
                                brand_day: { $first: "$brand_day" },
                                brand_day_offer: { $first: "$brand_day_offer" },
                                brand_segment: { $push: "$brand_segment" },
                                sorting: { $first: "$sorting" },
                                status: { $first: "$status" },
                                updatedAt: { $first: "$updatedAt" },
                                createdAt: { $first: "$createdAt" },
                                updatedBy: { $first: "$updatedBy" },
                                createdBy: { $first: "$createdBy" },
                            }
                        },
                        { $skip: skip },
                        { $limit: limit },
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

        return res.status(200).json(
            success(brands, "Brands fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },

            )
        );

    } catch (error) {
        return _req.status(500).json({ success: false, message: error.message });
    }
};


module.exports = { createBrand, updateBrand, getBrands }