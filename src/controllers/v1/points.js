const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { PointsModel } = require("../../schemas/points");

const getPoints = async (_req, res) => {
    try {
        const { _id } = _req.user
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;

        const matchStage = {
            _id: new mongoose.Types.ObjectId(_id)
        };

        const aggregationPipeline = [
            { $match: matchStage },


            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await PointsModel.aggregate(aggregationPipeline);

        const points = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return res.status(200).json(
            success(points, "Points fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            )
        );

    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};


module.exports = { getPoints }