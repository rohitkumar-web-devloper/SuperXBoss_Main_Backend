const { error, success, parseBool } = require("../../functions/functions");
const { WalletModel } = require("../../schemas/wallet");
const { createWalletSchema, updateWalletSchema } = require("../../Validation/walletr");

const createWallet = async (_req, _res) => {
    const { error: customError, value } = createWalletSchema.validate(_req.body);
    if (customError) {
        return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
    }
    const createdBy = _req.user?._id;

    const recharge = new WalletModel({
        ...value,
        createdBy
    });

    await recharge.save()
    return _res.status(200).json(success(recharge, "Recharge Offer Created successfully"));

}
const updateWallet = async (_req, _res) => {
    const { error: customError, value } = updateWalletSchema.validate(_req.body);
    if (customError) {
        return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
    }
    const { recharge } = _req.params;
    const updatedBy = _req.user?._id;
    const existingCUnit = await WalletModel.findById(recharge);
    if (!existingCUnit) {
        return _res.status(404).json(error(404, "Recharge not found."));
    }

    const updatedData = {
        ...value,
        updatedBy
    };
    const updatedUnit = await WalletModel.findByIdAndUpdate(recharge, updatedData, { new: true });
    return _res.status(200).json(success(updatedUnit, "Recharge Offer Updated successfully"));

}
const getWallet = async (_req, _res) => {
    const { active, pagination = "true" } = _req.query || {}
    const usePagination = pagination === "true";
    const page = parseInt(_req.query.page) || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";
    const matchStage = {};
    if (search) {
        matchStage.$or = [
            { amountStr: { $regex: search, $options: "i" } },
            { offerAmountStr: { $regex: search, $options: "i" } }
        ]

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
        {
            $addFields: {
                amountStr: { $toString: "$amount" },
                offerAmountStr: { $toString: "$offer_amount" }
            }
        },
        { $match: matchStage },
        {
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
        },
        {
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
        },
        { $sort: { createdAt: -1 } },
        ...(usePagination ? [{ $skip: skip }, { $limit: limit }] : []),
        {
            $facet: {
                data: [
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ]
    const result = await WalletModel.aggregate(aggregationPipeline);
    const units = result[0].data;

    const total = result[0].totalCount[0]?.count || 0;

    return _res.status(200).json(
        success(units, "Recharge offer fetched successfully",
            {
                total,
                page: usePagination ? page : 1,
                limit: usePagination ? limit : total,
                totalPages: usePagination ? Math.ceil(total / limit) : 1,
            }

        )
    );
}

module.exports = { createWallet, updateWallet, getWallet }