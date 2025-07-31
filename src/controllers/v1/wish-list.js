const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { WishListModel } = require("../../schemas/wish-list");

const createWishList = async (_req, _res) => {
    try {
        const { _id } = _req.user
        const { product } = _req.body;

        if (!product) {
            return _res.status(400).json(error(400, "Product Id is required."));
        }
        const existingEntry = await WishListModel.findOne({
            product_id: product,
            customer_id: _id,
        });
        if (existingEntry) {
            existingEntry.isAdded = !existingEntry.isAdded;
            await existingEntry.save();
            return _res
                .status(200)
                .json(success(existingEntry, "Wishlist updated successfully."));
        } else {
            const data = new WishListModel({
                product_id: product,
                customer_id: _id,
                isAdded: true,
            });

            const saved = await data.save();
            return _res
                .status(201)
                .json(success(saved, "Wish list added successfully."));
        }
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};
const getWishList = async (_req, _res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const { _id, type } = _req.user;

        const hasUser = type === "customer" && mongoose.Types.ObjectId.isValid(_id);
        const userObjectId = hasUser ? new mongoose.Types.ObjectId(_id) : null;

        const result = await WishListModel.aggregate([
            {
                $match: {
                    isAdded: true,
                    customer_id: new mongoose.Types.ObjectId(_id)
                    // customer_id: new mongoose.Types.ObjectId("687f5cd1011ab240defdca98")
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
                        {
                            $addFields: {
                                "product.unit": "$unit"
                            }
                        },
                        {
                            $project: {
                                unit: 0
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
            .json(success(list, "Wishlist fetch successfully.",
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


module.exports = { createWishList, getWishList }