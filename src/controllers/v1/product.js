const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");
const { ProductModel } = require("../../schemas/product");
const { productJoiSchema } = require("../../Validation/product");
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

        const payload = {
            ...value,
            bulk_discount: value.bulk_discount ? JSON.parse(value.bulk_discount) : [],
            images,
            video: video,
            createdBy: _req.user._id,
            user: _req.user._id,
        };
        const product = new ProductModel(payload);
        await product.save()
        return _res.json(success(product, "Product Created Successfully."))
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}

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

        const payload = {
            ...value,
            images: updatedImages,
            video: videoPath,
            updatedBy: _req.user._id,
            bulk_discount: value.bulk_discount ? JSON.parse(value.bulk_discount) : [],
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
        const { active, pagination } = _req.query || {};
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";

        const matchStage = {};

        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku_id: { $regex: search, $options: "i" } },
                { hsn_code: { $regex: search, $options: "i" } }
            ];
        }
        if (active == "true") {
            matchStage.status = true;
        }
        if (active == "false") {
            matchStage.status = false;
        }

        const dataStages = [
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
                    segment_type: { $push: "$segment_type" },
                }
            },
            { $sort: { createdAt: -1 } }
        ];
        if (pagination != 'false') {
            dataStages.push({ $skip: skip }, { $limit: limit });
        }

        const aggregationPipeline = [
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
            {
                $project: {
                    "createdBy.access_token": 0,
                    "createdBy.password": 0,
                    "createdBy.createdAt": 0,
                    "createdBy.updatedAt": 0,
                    "createdBy.role": 0,
                    "createdBy.type": 0,
                    "createdBy.status": 0,
                    "createdBy.mobile": 0,
                    "createdBy.whatsapp": 0,
                    "createdBy.address": 0,
                    "createdBy.countryCode": 0,
                    "createdBy.updatedBy": 0,
                    "createdBy.parent": 0,
                    "updatedBy.access_token": 0,
                    "updatedBy.password": 0,
                    "updatedBy.createdAt": 0,
                    "updatedBy.updatedAt": 0,
                    "updatedBy.role": 0,
                    "updatedBy.type": 0,
                    "updatedBy.status": 0,
                    "updatedBy.mobile": 0,
                    "updatedBy.whatsapp": 0,
                    "updatedBy.address": 0,
                    "updatedBy.countryCode": 0,
                    "updatedBy.updatedBy": 0,
                    "updatedBy.parent": 0,
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
                    data: dataStages,
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await ProductModel.aggregate(aggregationPipeline);
        const product = result[0].data;
        const total = result[0].totalCount[0]?.count || product.length;

        return _res.status(200).json(success(
            product, "Success",
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
            {
                $project: {
                    "createdBy.access_token": 0,
                    "createdBy.password": 0,
                    "createdBy.createdAt": 0,
                    "createdBy.updatedAt": 0,
                    "createdBy.role": 0,
                    "createdBy.type": 0,
                    "createdBy.status": 0,
                    "createdBy.mobile": 0,
                    "createdBy.whatsapp": 0,
                    "createdBy.address": 0,
                    "createdBy.countryCode": 0,
                    "createdBy.updatedBy": 0,
                    "createdBy.parent": 0,
                    "updatedBy.access_token": 0,
                    "updatedBy.password": 0,
                    "updatedBy.createdAt": 0,
                    "updatedBy.updatedAt": 0,
                    "updatedBy.role": 0,
                    "updatedBy.type": 0,
                    "updatedBy.status": 0,
                    "updatedBy.mobile": 0,
                    "updatedBy.whatsapp": 0,
                    "updatedBy.address": 0,
                    "updatedBy.countryCode": 0,
                    "updatedBy.updatedBy": 0,
                    "updatedBy.parent": 0,
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

module.exports = { createProduct, updateProduct, getProducts, getProductsById }