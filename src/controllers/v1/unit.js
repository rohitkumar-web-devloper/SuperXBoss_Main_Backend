const { error, success } = require("../../functions/functions");
const { UnitModel } = require("../../schemas/unit");
const { createUnitSchema } = require("../../Validation/unit");

const createUnit = async (_req, _res) => {
    const { error: customError, value } = createUnitSchema.validate(_req.body);
    if (customError) {
        return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
    }
    const createdBy = _req.user?._id;

    const unit = new UnitModel({
        ...value,
        createdBy
    });

    await unit.save()
    return _res.status(200).json(success(unit, "Unit Created successfully"));

}
const updateUnit = async (_req, _res) => {
    const { error: customError, value } = createUnitSchema.validate(_req.body);
    if (customError) {
        return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
    }
    const { unit } = _req.params;
    const updatedBy = _req.user?._id;
    const existingCUnit = await UnitModel.findById(unit);
    if (!existingCUnit) {
        return _res.status(404).json(error(404, "Unit not found."));
    }
    const duplicate = await UnitModel.findOne({ name: value.name, _id: { $ne: unit } });
    if (duplicate) {
        return _res.status(400).json(error(400, `${value.name} unit already exists.`));
    }
    const updatedData = {
        ...value,
        updatedBy
    };
    const updatedUnit = await UnitModel.findByIdAndUpdate(unit, updatedData, { new: true });
    return _res.status(200).json(success(updatedUnit, "Unit Updated successfully"));

}
const getUnits = async (_req, _res) => {

    const { active, pagination = "true" } = _req.query || {}
    const usePagination = pagination === "true";
    const page = parseInt(_req.query.page) || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";
    const matchStage = {};
    if (search) {
        matchStage.name = { $regex: search, $options: "i" };
    }
    if (active == "true") {
        matchStage.status = true
    }
    if (active == "false") {
        matchStage.status = false
    }
    const aggregationPipeline = [
        { $match: matchStage },
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
        { $sort: { createdAt: -1 } },
        ...(usePagination ? [{ $skip: skip }, { $limit: limit }] : []),

        // Facet for data and total count
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
    ]
    const result = await UnitModel.aggregate(aggregationPipeline);
    const units = result[0].data;

    const total = result[0].totalCount[0]?.count || 0;

    return _res.status(200).json(
        success(units, "Brands fetched successfully",
            {
                total,
                page: usePagination ? page : 1,
                limit: usePagination ? limit : total,
                totalPages: usePagination ? Math.ceil(total / limit) : 1,
            }

        )
    );
}

module.exports = { createUnit, updateUnit, getUnits }