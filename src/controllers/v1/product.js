const { error, success } = require("../../functions/functions");
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");
const { ProductModel } = require("../../schemas/product");
const { productJoiSchema } = require("../../Validation/product");
const createProduct = async (_req, _res) => {
    try {
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
                        'Validation failed',
                        newError.details?.[0]?.message
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
        if (video.originalname && video.buffer) {
            video = await imageUpload(video.originalname, video.buffer, 'product_video')
        } else {
            video = []
        }
        const payload = {
            ...value,
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
                        'Validation failed',
                        newError.details?.[0]?.message
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

        const payload = {
            ...value,
            images: updatedImages,
            video: videoPath,
            updatedBy: _req.user._id,
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
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";
        const matchStage = {};
        if (search) {
            matchStage.name = { $regex: search, $options: "i" };
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
                    "updatedBy.access_token": 0,
                    "updatedBy.password": 0,
                    "updatedBy.createdAt": 0,
                    "updatedBy.updatedAt": 0,
                    "updatedBy.role": 0,
                    "updatedBy.type": 0,
                    "updatedBy.status": 0,

                }
            },
            { $sort: { createdAt: 1 } },
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
                                segment_type: { $push: "$segment_type" },
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
        ]
        const result = await ProductModel.aggregate(aggregationPipeline);
        const product = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return _res.status(200).json(success(
            product, "Success",
            {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }));
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}

module.exports = { createProduct, updateProduct, getProducts }