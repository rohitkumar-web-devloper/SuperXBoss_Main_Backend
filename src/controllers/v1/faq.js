const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { FAQModel } = require('../../schemas/faq')
const { createFaqSchema, updateFaqSchema } = require('../../Validation/faq')
const createFAQ = async (_req, _res) => {
    try {
        const { _id } = _req.user;

        const { error: customError, value } = createFaqSchema.validate({ ..._req.body }, { abortEarly: false });

        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        const existing = await FAQModel.findOne({
            question: { $regex: `^${value.question}$`, $options: 'i' }
        });
        if (existing) {
            return _res.status(409).json(error(400, 'FAQ with this question already exists'));
        }

        const faq = new FAQModel({
            ...value,
            user_id: _id,
            createdBy: _id
        });

        const savedFaq = await faq.save();
        const { createdAt, updatedAt, ...rest } = savedFaq.toObject();

        return _res.status(201).json(success(rest, 'FAQ created successfully'));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};

const updateFAQ = async (_req, _res) => {
    try {
        const { error: customError, value } = updateFaqSchema.validate({ ..._req.body });

        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        const { _id } = _req.user;
        const { faqId } = _req.params;
        const faq = await FAQModel.findById(faqId);
        if (!faq) {
            return _res.status(404).json(error(404, 'FAQ not found'));
        }

        const existing = await FAQModel.findOne({
            question: { $regex: `^${value.question}$`, $options: 'i' },
            _id: { $ne: faqId }
        });
        if (existing) {
            return _res.status(409).json(error(409, 'Another FAQ with this question already exists'));
        }

        const updatedData = {
            ...value,
            updatedBy: _id
        };

        const updatedFAQ = await FAQModel.findByIdAndUpdate(faqId, updatedData, { new: true });

        const { createdAt, updatedAt, ...rest } = updatedFAQ.toObject();
        return _res.status(200).json(success(rest, 'FAQ updated successfully'));
    } catch (err) {
        console.error('Update FAQ Error:', err);
        return _res.status(500).json(error(500, err.message));
    }
};

const getFAQs = async (_req, res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";
        const { type, status } = _req.query;
        const { _id, type: useType } = _req.user
        const hasUser = useType == "customer" ? mongoose.Types.ObjectId.isValid(_id) : false

        const matchStage = {};
        if (search) {
            matchStage.$or = [
                { question: { $regex: search, $options: "i" } },
                { answer: { $regex: search, $options: "i" } }
            ];
        }
        if (type) matchStage.type = type;
        if (status !== undefined) matchStage.status = status === 'true';

        const aggregationPipeline = [
            { $match: matchStage },
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

        const result = await FAQModel.aggregate(aggregationPipeline);

        const faqs = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return res.status(200).json(
            success(faqs, "FAQs fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            )
        );

    } catch (error) {
        return _res.status(500).json(error(500, error.message));
    }
};

module.exports = { createFAQ, updateFAQ, getFAQs };