const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { AddToCartModel } = require("../../schemas/add-to-cart");
const { ProductModel } = require("../../schemas/product");

const createAddToCartList = async (_req, _res) => {
    try {
        const { _id } = _req.user
        const { product, qty = 1 } = _req.body;

        if (!product) {
            return _res.status(400).json(error(400, "Product Id is required."));
        }

        if (qty == undefined || qty == null) {
            return _res.status(400).json(error(400, "Product Qty is required."));
        }
        if ((qty || 0) < 0) {
            return _res.status(400).json(error(400, "Product Qty must be one."));
        }

        const productData = await ProductModel.findById(product)
        if (!productData) {
            return _res.status(400).json(error(400, "Product not found."));
        }
        if (productData.item_stock <= 0) {
            return _res.status(400).json(error(400, "Product is out of stock."));
        }
        if (productData.item_stock < qty) {
            return _res.status(400).json(error(400, "Requested quantity exceeds available stock."));
        }
        const existingEntry = await AddToCartModel.findOne({
            product_id: product,
            customer_id: _id,
        });
        if (existingEntry) {
            existingEntry.qty = qty;
            await existingEntry.save();
            return _res
                .status(200)
                .json(success(existingEntry, "Add To Cart updated successfully."));
        } else {
            const data = new AddToCartModel({
                product_id: product,
                customer_id: _id,
                qty,
            });

            const saved = await data.save();
            return _res
                .status(201)
                .json(success(saved, "Add To Cart added successfully."));
        }
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};

const getAddToCartList = async (_req, _res) => {
    try {
        const { _id, type } = _req.user;
        const { pagination = "true" } = _req.query || {}
        const usePagination = pagination === "true";
        const hasUser = type === "customer" && mongoose.Types.ObjectId.isValid(_id);
        const userObjectId = hasUser ? new mongoose.Types.ObjectId(_id) : null;
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;

        const result = await AddToCartModel.aggregate([
            {
                $match: {
                    isCheckedOut: false,
                    status: true,
                    customer_id: new mongoose.Types.ObjectId(_id),
                    qty: { $gt: 0 }
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
                                "product.brand": "$brand",
                                "product.unit": "$unit"
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
                            $project: {
                                unit: 0,
                                brand: 0,
                                wishListData: 0,
                                addToCartDetails: 0,
                            }
                        },
                        ...(usePagination ? [{ $skip: skip }, { $limit: limit }] : [])
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
            .json(success(list, "Add to cart fetch successfully.",
                {
                    total,
                    page: usePagination ? page : 1,
                    limit: usePagination ? limit : total,
                    totalPages: usePagination ? Math.ceil(total / limit) : 1,
                }
            ));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};



module.exports = { createAddToCartList, getAddToCartList }