const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { RecentViewProductModel } = require("../../schemas/recent-view-products");
const createRecentHistory = async (_req, _res) => {
    try {
        const { _id } = _req.user
        const { product } = _req.body;

        if (!product) {
            return _res.status(400).json(error(400, "Product Id is required."));
        }
        const existingEntry = await RecentViewProductModel.findOne({
            product_id: product,
            customer_id: _id,
        });
        if (existingEntry) {
            existingEntry.count = existingEntry.count + 1;
            await existingEntry.save();
            return _res
                .status(200)
                .json(success(existingEntry, "Product view count updated successfully."));
        } else {
            const data = new RecentViewProductModel({
                product_id: product,
                customer_id: _id,
                count: 1,
            });

            const saved = await data.save();
            return _res
                .status(201)
                .json(success(saved, "Product view added successfully."));
        }
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};
const getRecentViewHistory = async (_req, _res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const { _id, type } = _req.user;

        const hasUser = type === "customer" && mongoose.Types.ObjectId.isValid(_id);
        const userObjectId = hasUser ? new mongoose.Types.ObjectId(_id) : null;

        const result = await RecentViewProductModel.aggregate([
            {
                $match: {
                    customer_id: new mongoose.Types.ObjectId(_id)
                }
            },
            { $sort: { createdAt: -1 } },

            {
                $facet: {
                    data: [
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
                        {
                            $lookup: {
                                from: "units",
                                localField: "product.unit",
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

                        {
                            $addFields: {
                                "product.unit": "$unit"
                            }
                        },
                        {
                            $project: {
                                unit: 0,
                                brand: 0,
                            }
                        },
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                },

            }
        ])

        let list = result[0].data;
        list = list.map((it) => it.product)
        const total = result[0].totalCount[0]?.count || result.length;

        return _res
            .status(200)
            .json(success(list, "Viewed Products fetch successfully.",
                {
                    total,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(total / limit),
                }
            ));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};
module.exports = { createRecentHistory, getRecentViewHistory }