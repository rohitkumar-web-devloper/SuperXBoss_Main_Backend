const { default: mongoose } = require("mongoose");
const { error, success, parseBool } = require("../../functions/functions");
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");
const { ProductModel } = require("../../schemas/product");
const { productJoiSchema } = require("../../Validation/product");
const { VehicleProductModel } = require("../../schemas/vehicle-products");
const createProduct = async (_req, _res) => {
    try {
        if (!_req?.body) {
            return _res.status(400).json(error(400, "Product Body is required."));
        }
        const { error: newError, value } = productJoiSchema.validate(_req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (newError) {
            return _res
                .status(400)
                .json(
                    error(
                        400,
                        newError.details?.[0]?.message,
                        'Validation failed',
                    )
                );
        }
        let images = _req?.files?.['images'] || [];

        let video = _req?.files?.['video'] ? _req.files['video'][0] : null;
        if (images.length) {
            images = await Promise.all(
                images.map(async (it) => {
                    return await imageUpload(it.originalname, it.buffer, 'product_photos');
                })
            );
        } else {
            images = []
        }
        if (video && video?.originalname && video?.buffer) {
            video = await imageUpload(video.originalname, video.buffer, 'product_video')
        }
        const any_offer = value.any_discount || 0;
        const discount_customer_price = value.customer_price;
        const discount_b2b_price = value.b2b_price;
        const final_customer_price = discount_customer_price - (discount_customer_price * any_offer / 100);
        const final_b2b_price = discount_b2b_price - (discount_b2b_price * any_offer / 100);
        const payload = {
            ...value,
            bulk_discount: value.bulk_discount ? JSON.parse(value.bulk_discount) : [],
            images,
            video: video,
            createdBy: _req.user._id,
            user: _req.user._id,
            discount_customer_price: final_customer_price,
            discount_b2b_price: final_b2b_price
        };
        const product = new ProductModel(payload);
        await product.save()
        return _res.json(success(product, "Product Created Successfully."))
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}
const createVehicleProduct = async (_req, _res) => {
    try {
        if (!_req?.body) {
            return _res.status(400).json(error(400, "Body is required."));
        }
        const { assign_data, product_id } = _req.body;
        if (!assign_data) {
            return _res.status(400).json(error(400, "Assign data is required."));
        }
        const responses = [];
        for (const [brand_id, data] of Object.entries(assign_data)) {
            console.log(data, "data");

            const existing = await VehicleProductModel.findOne({ product_id, brand_id });
            if (existing) {
                existing.vehicle_ids = data.vehicles;
                existing.categories = data.categories;
                existing.status = data.status;
                await existing.save();
                responses.push({ action: 'updated', product_id, brand_id, vehicle_ids: data?.vehicles, status: data?.data });
            } else {
                const newDoc = new VehicleProductModel({ product_id, brand_id, vehicle_ids: data?.vehicles, status: data?.status, categories: data?.categories });
                await newDoc.save();
                responses.push({ action: 'created', product_id, brand_id, vehicle_ids: data?.vehicles, status: data?.data, categories: data?.categories });
            }
        }

        return _res.json(success(responses, "Vehicle product(s) processed successfully."));
    } catch (err) {
        console.error(err);
        return _res.status(500).json(error(500, err.message));
    }
};
const getVehicleProduct = async (_req, _res) => {
    try {
        const { product_id } = _req?.params

        if (!product_id) {
            return _res.status(400).json(error(400, "Product id is required."));
        }

        let result;
        const product = await VehicleProductModel.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(product_id) } },
            { $sort: { createdAt: -1 } }
        ])

        result = product.reduce((acc, curr) => {
            acc[curr.brand_id] = { vehicles: curr.vehicle_ids, status: curr.status, categories: curr?.categories };
            return acc;
        }, {});

        return _res.json(success(result, "Product fetch Successfully."))
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}
const getVehicleAssignProduct = async (_req, _res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const { vehicle = "", brand_id, } = _req?.query
        let vehicleIds = [];
        if (vehicle) {
            const parts = vehicle.split(",");
            vehicleIds = parts
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
        }
        const matchStage = {};
        if (vehicleIds.length > 0) {
            matchStage.vehicle_ids = { $in: vehicleIds };
        }
        if (brand_id) {
            matchStage.brand_id = new mongoose.Types.ObjectId(brand_id);
        }
        matchStage.status = true

        const product = await VehicleProductModel.aggregate([
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle_ids",
                    foreignField: "_id",
                    as: "vehicle_data"
                }
            },
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: true
                }
            },

            { $skip: skip },
            { $limit: limit },
            {
                $facet: {
                    data: [
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ])
        const total = product[0].totalCount[0]?.count || 0;
        let onlyProducts = product[0].data;
        onlyProducts = onlyProducts.map((it) => it.product)
        return _res.status(200).json(
            success(onlyProducts, "Product fetch Successfully.",
                {
                    total,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(total / limit),
                }

            )
        );

    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}
const getVehicleAssignProductWithYear = async (_req, _res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const { vehicle = "", brand_id, year, segment, categories } = _req?.query;
        const { _id, type } = _req.user;
        const hasUser = type != "vendor" ? mongoose.Types.ObjectId.isValid(_id) : false
        const userObjectId = hasUser ? new mongoose.Types.ObjectId(_id) : null;

        let vehicleIds = [];
        if (vehicle) {
            vehicleIds = vehicle.split(",").filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
        }

        let matchStage = { status: true };

        if (categories) {
            matchStage.categories = { $in: [new mongoose.Types.ObjectId(categories)] };
        }
        let brandIds = [];
        if (brand_id) {
            brandIds = brand_id.split(",").filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
            if (brandIds.length > 0) {
                matchStage.brand_id = { $in: brandIds };
            }
            if (vehicleIds.length > 0) {
                matchStage.vehicle_ids = { $in: vehicleIds };
            }
        }

        let segment_data = [];
        if (segment) {
            segment_data = typeof segment === "string"
                ? [new mongoose.Types.ObjectId(segment)]
                : segment.map(id => new mongoose.Types.ObjectId(id));
        }

        const aggregationPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle_ids",
                    foreignField: "_id",
                    as: "vehicle_data",
                    pipeline: [
                        { $project: { start_year: 1, end_year: 1 } }
                    ]
                }
            },
            ...(year
                ? [
                    {
                        $addFields: {
                            vehicle_year_match: {
                                $anyElementTrue: {
                                    $map: {
                                        input: "$vehicle_data",
                                        as: "v",
                                        in: {
                                            $and: [
                                                { $lte: ["$$v.start_year", parseInt(year)] },
                                                { $gte: ["$$v.end_year", parseInt(year)] }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    { $match: { vehicle_year_match: true } }
                ]
                : []),
            {
                $group: {
                    _id: "$product_id",
                    product_id: { $first: "$product_id" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    let: { pid: "$product_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$pid"] } } },
                        ...(segment_data.length
                            ? [{ $match: { segment_type: { $in: segment_data } } }]
                            : [])
                    ],
                    as: "product"
                }
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: false } },
            ...(hasUser
                ? [
                    {
                        $lookup: {
                            from: "wish_lists",
                            let: { productId: "$product._id", userId: userObjectId },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$product_id", "$$productId"] },
                                                { $eq: ["$customer_id", "$$userId"] },
                                                { $eq: ["$isAdded", true] }
                                            ]
                                        }
                                    }
                                },
                                { $limit: 1 }
                            ],
                            as: "wishListData"
                        }
                    },
                    {
                        $addFields: {
                            "product.wishList": { $gt: [{ $size: "$wishListData" }, 0] }
                        }
                    }
                ]
                : []),
            ...(hasUser
                ? [
                    {
                        $lookup: {
                            from: "add_to_carts",
                            let: { productId: "$product._id", userId: userObjectId },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$product_id", "$$productId"] },
                                                { $eq: ["$customer_id", "$$userId"] },
                                                { $eq: ["$isCheckedOut", false] }
                                            ]
                                        }
                                    }
                                },
                                { $limit: 1 }
                            ],
                            as: "addToCartDetails"
                        }
                    },
                    {
                        $unwind: {
                            path: "$addToCartDetails",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {
                            "product.addToCartQty": "$addToCartDetails.qty"
                        }
                    }
                ]
                : []),
            { $sort: { "product.createdAt": -1, "product._id": 1 } },
            {
                $lookup: {
                    from: "brands",
                    localField: "product.brand_id",
                    foreignField: "_id",
                    as: "brand",
                    pipeline: [
                        { $project: { name: 1, _id: 1 } }
                    ]
                }
            },
            { $unwind: { path: "$brand", preserveNullAndEmptyArrays: false } },
            {
                $addFields: {
                    "product.brand": "$brand"
                }
            },
            {
                $project: {
                    vehicle_ids: 0,
                    wishListData: 0,
                    addToCartDetails: 0,
                }
            },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const product = await VehicleProductModel.aggregate(aggregationPipeline);

        const total = product[0].totalCount[0]?.count || 0;

        let onlyProducts = product[0].data.map((item) => item.product);


        return _res.status(200).json(
            success(onlyProducts, "Product fetch successfully.", {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            })
        );

    } catch (err) {
        console.error(err);
        return _res.status(500).json(error(500, err.message));
    }
};
const updateProduct = async (_req, _res) => {
    try {
        if (!_req?.body) {
            return _res.status(400).json(error(400, "Product Body is required."));
        }
        const { error: newError, value } = productJoiSchema.validate(_req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (newError) {
            return _res
                .status(400)
                .json(
                    error(
                        400,
                        newError.details?.[0]?.message,
                        'Validation failed'
                    )
                );
        }
        const { productId } = _req.params;
        let images = _req?.files?.['images'] || [];
        let video = _req?.files?.['video'] ? _req.files['video'][0] : null;
        const product = await ProductModel.findById(productId)
        if (!product) {
            return _res.status(400).json(error(500, "Product Not Found."));
        }
        let updatedImages = Array.from(product.images || []);
        if (Array.isArray(value.removed_images)) {
            value.removed_images.forEach((imgPath) => {
                unlinkOldFile(imgPath);
                updatedImages = updatedImages.filter(p => p !== imgPath);
            });
        } else {
            if (value.removed_images) {
                unlinkOldFile(value.removed_images);
                updatedImages = updatedImages.filter(p => p !== value.removed_images);
            }

        }
        delete value.removed_images;

        if (images?.length) {
            const uploads = await Promise.all(
                images.map(f => imageUpload(f.originalname, f.buffer, 'product_photos'))
            );
            updatedImages = updatedImages.concat(uploads);
        }

        let videoPath = product.video;
        if (video) {
            if (videoPath) unlinkOldFile(videoPath);
            const v = video;
            videoPath = await imageUpload(v.originalname, v.buffer, 'product_video');
        }
        if (value?.videoRemove) {
            if (videoPath) unlinkOldFile(videoPath);
        }
        delete value?.videoRemove
        const any_offer = value.any_discount || 0;
        const discount_customer_price = value.customer_price;
        const discount_b2b_price = value.b2b_price;
        const final_customer_price = discount_customer_price - (discount_customer_price * any_offer / 100);
        const final_b2b_price = discount_b2b_price - (discount_b2b_price * any_offer / 100);
        const payload = {
            ...value,
            images: updatedImages,
            video: videoPath,
            updatedBy: _req.user._id,
            bulk_discount: value.bulk_discount ? JSON.parse(value.bulk_discount) : [],
            discount_customer_price: final_customer_price,
            discount_b2b_price: final_b2b_price
        };
        const updated = await ProductModel.findByIdAndUpdate(productId, payload, {
            new: true,
            runValidators: true,
        });
        return _res.status(200).json(success(updated));
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}
const getProducts = async (_req, _res) => {
    try {
        const { active, pagination, trend_part, wish_product, pop_item, new_arrival, search = "", segment = "" } = _req.query || {};
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const { _id, type } = _req.user
        const hasUser = type != "vendor" ? mongoose.Types.ObjectId.isValid(_id) : false
        const userObjectId = hasUser ? new mongoose.Types.ObjectId(_id) : null;

        const matchStage = {};

        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku_id: { $regex: search, $options: "i" } },
                { hsn_code: { $regex: search, $options: "i" } },
                { part_no: { $regex: search, $options: "i" } },
                { customerPriceStr: { $regex: search, $options: "i" } },
                { b2bPriceStr: { $regex: search, $options: "i" } },
            ];
        }

        let booleanFilters = {
            status: parseBool(active),
            trend_part: parseBool(trend_part),
            wish_product: parseBool(wish_product),
            pop_item: parseBool(pop_item),
            new_arrival: parseBool(new_arrival),
        };

        const segment_data = segment ? segment.split(",") : ""
        if (segment_data && segment_data.length) {
            booleanFilters.segment_type = {
                $in: typeof segment_data == "string" ? [new mongoose.Types.ObjectId(segment_data)] : segment_data.map(id => new mongoose.Types.ObjectId(id)),
            };
        }

        for (const [key, value] of Object.entries(booleanFilters)) {
            if (value !== undefined) {
                matchStage[key] = value;
            }
        }
        const aggregationPipeline = [
            {
                $addFields: {
                    customerPriceStr: { $toString: "$customer_price" },
                    b2bPriceStr: { $toString: "$b2b_price" }
                }
            },
            { $match: matchStage },
            {
                $lookup: {
                    from: "vehicle_segment_types",
                    localField: "segment_type",
                    foreignField: "_id",
                    as: "segment_type"
                }
            },
            {
                $unwind: {
                    path: "$segment_type",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                $unwind: {
                    path: "$brand",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "units",
                    localField: "unit",
                    foreignField: "_id",
                    as: "unit"
                }
            },
            {
                $unwind: {
                    path: "$unit",
                    preserveNullAndEmptyArrays: true
                }
            },
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
                $project: {
                    "bulk_discount._id": 0,
                    "brand.brand_segment": 0,
                    "brand.brand_day_offer": 0,
                    "brand.brand_day": 0,
                    "brand.type": 0,
                    "brand.description": 0,
                    "brand.sorting": 0,
                }
            },
            {
                $facet: {
                    data: [
                        {
                            $group: {
                                _id: "$_id",
                                name: { $first: "$name" },
                                video: { $first: "$video" },
                                b2b_price: { $first: "$b2b_price" },
                                discount_b2b_price: { $first: "$discount_b2b_price" },
                                discount_customer_price: { $first: "$discount_customer_price" },
                                point: { $first: "$point" },
                                new_arrival: { $first: "$new_arrival" },
                                pop_item: { $first: "$pop_item" },
                                part_no: { $first: "$part_no" },
                                customer_price: { $first: "$customer_price" },
                                min_qty: { $first: "$min_qty" },
                                wish_product: { $first: "$wish_product" },
                                any_discount: { $first: "$any_discount" },
                                item_stock: { $first: "$item_stock" },
                                sku_id: { $first: "$sku_id" },
                                tax: { $first: "$tax" },
                                hsn_code: { $first: "$hsn_code" },
                                ship_days: { $first: "$ship_days" },
                                return_days: { $first: "$return_days" },
                                weight: { $first: "$weight" },
                                unit: { $first: "$unit" },
                                status: { $first: "$status" },
                                trend_part: { $first: "$trend_part" },
                                brand: { $first: "$brand" },
                                images: { $first: "$images" },
                                bulk_discount: { $first: "$bulk_discount" },
                                updatedAt: { $first: "$updatedAt" },
                                createdAt: { $first: "$createdAt" },
                                updatedBy: { $first: "$updatedBy" },
                                createdBy: { $first: "$createdBy" },
                                return_policy: { $first: "$return_policy" },
                                segment_type: { $push: "$segment_type" },
                            }
                        },
                        ...(hasUser
                            ? [
                                {
                                    $lookup: {
                                        from: "wish_lists",
                                        let: { productId: "$_id", userId: userObjectId },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$product_id", "$$productId"] },
                                                            { $eq: ["$customer_id", "$$userId"] },
                                                            { $eq: ["$isAdded", true] },
                                                        ],
                                                    },
                                                },
                                            },
                                            { $limit: 1 }, // small optimization
                                        ],
                                        as: "wishListData",
                                    },
                                },
                                {
                                    $addFields: {
                                        wishList: { $gt: [{ $size: "$wishListData" }, 0] },
                                    },
                                },
                                { $project: { wishListData: 0 } },
                            ]
                            : []),
                        ...(hasUser
                            ? [
                                {
                                    $lookup: {
                                        from: "add_to_carts",
                                        let: { productId: "$_id", userId: userObjectId },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$product_id", "$$productId"] },
                                                            { $eq: ["$customer_id", "$$userId"] },
                                                            { $eq: ["$isCheckedOut", false] }
                                                        ]
                                                    }
                                                }
                                            },
                                            { $limit: 1 }
                                        ],
                                        as: "addToCartDetails"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$addToCartDetails",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $addFields: {
                                        "addToCartQty": "$addToCartDetails.qty"
                                    }
                                }
                            ]
                            : []),
                        { $sort: { createdAt: -1 } },
                        ...(pagination != 'false' ? [{ $skip: skip }, { $limit: limit }] : []),
                    ],
                    totalCount: [
                        {
                            $group: {
                                _id: "$_id"
                            }
                        },
                        { $count: "count" } // now counts unique products
                    ]
                }
            }
        ];
        const result = await ProductModel.aggregate(aggregationPipeline);
        const product = result[0].data;
        const total = result[0].totalCount[0]?.count || product.length;
        return _res.status(200).json(success(product, "Success",
            {
                total,
                page: pagination === 'false' ? 1 : page,
                limit: pagination === 'false' ? total : limit,
                totalPages: pagination === 'false' ? 1 : Math.ceil(total / limit),
            }));
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}
const getProductsById = async (_req, _res) => {
    try {
        const { productId } = _req.params
        const { type, _id } = _req.user
        const userObjectId = hasUser ? new mongoose.Types.ObjectId(_id) : null;
        const hasUser = type != "vendor" ? mongoose.Types.ObjectId.isValid(_id) : false

        const aggregationPipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(productId), } },
            {
                $lookup: {
                    from: "vehicle_segment_types",
                    localField: "segment_type",
                    foreignField: "_id",
                    as: "segment_type"
                }
            },
            {
                $unwind: {
                    path: "$segment_type",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                $unwind: {
                    path: "$brand",
                    preserveNullAndEmptyArrays: true
                }
            },
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
                $lookup: {
                    from: "units",
                    localField: "unit",
                    foreignField: "_id",
                    as: "unit"
                }
            },
            {
                $unwind: {
                    path: "$unit",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    "bulk_discount._id": 0,
                    "brand.brand_segment": 0,
                    "brand.brand_day_offer": 0,
                    "brand.brand_day": 0,
                    "brand.type": 0,
                    "brand.description": 0,
                }
            },
            {
                $facet: {
                    data: [
                        {
                            $group: {
                                _id: "$_id",
                                name: { $first: "$name" },
                                video: { $first: "$video" },
                                b2b_price: { $first: "$b2b_price" },
                                point: { $first: "$point" },
                                new_arrival: { $first: "$new_arrival" },
                                pop_item: { $first: "$pop_item" },
                                part_no: { $first: "$part_no" },
                                customer_price: { $first: "$customer_price" },
                                min_qty: { $first: "$min_qty" },
                                wish_product: { $first: "$wish_product" },
                                any_discount: { $first: "$any_discount" },
                                item_stock: { $first: "$item_stock" },
                                sku_id: { $first: "$sku_id" },
                                tax: { $first: "$tax" },
                                hsn_code: { $first: "$hsn_code" },
                                ship_days: { $first: "$ship_days" },
                                return_days: { $first: "$return_days" },
                                weight: { $first: "$weight" },
                                unit: { $first: "$unit" },
                                status: { $first: "$status" },
                                trend_part: { $first: "$trend_part" },
                                brand: { $first: "$brand" },
                                images: { $first: "$images" },
                                bulk_discount: { $first: "$bulk_discount" },
                                updatedAt: { $first: "$updatedAt" },
                                createdAt: { $first: "$createdAt" },
                                updatedBy: { $first: "$updatedBy" },
                                createdBy: { $first: "$createdBy" },
                                return_policy: { $first: "$return_policy" },
                                description: { $first: "$description" },
                                segment_type: { $push: "$segment_type" },
                                discount_b2b_price: { $first: "$discount_b2b_price" },
                                discount_customer_price: { $first: "$discount_customer_price" },
                            }
                        },
                        ...(hasUser
                            ? [
                                {
                                    $lookup: {
                                        from: "wish_lists",
                                        let: { productId: "$_id", userId: userObjectId },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$product_id", "$$productId"] },
                                                            { $eq: ["$customer_id", "$$userId"] },
                                                            { $eq: ["$isAdded", true] },
                                                        ],
                                                    },
                                                },
                                            },
                                            { $limit: 1 }, // small optimization
                                        ],
                                        as: "wishListData",
                                    },
                                },
                                {
                                    $addFields: {
                                        wishList: { $gt: [{ $size: "$wishListData" }, 0] },
                                    },
                                },
                                { $project: { wishListData: 0 } },
                            ]
                            : []),
                        ...(hasUser
                            ? [
                                {
                                    $lookup: {
                                        from: "add_to_carts",
                                        let: { productId: "$_id", userId: userObjectId },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$product_id", "$$productId"] },
                                                            { $eq: ["$customer_id", "$$userId"] },
                                                            { $eq: ["$isCheckedOut", false] }
                                                        ]
                                                    }
                                                }
                                            },
                                            { $limit: 1 }
                                        ],
                                        as: "addToCartDetails"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$addToCartDetails",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $addFields: {
                                        "addToCartQty": "$addToCartDetails.qty"
                                    }
                                }
                            ]
                            : []),
                    ],
                }
            }
        ]
        const result = await ProductModel.aggregate(aggregationPipeline);
        const product = result[0].data[0];

        return _res.status(200).json(success(product, "Success"));
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}
module.exports = { createProduct, updateProduct, getProducts, getProductsById, createVehicleProduct, getVehicleProduct, getVehicleAssignProduct, getVehicleAssignProductWithYear }