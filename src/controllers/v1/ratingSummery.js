const Joi = require("joi");
const { error, success } = require("../../functions/functions");
const { RatingSummary } = require('../../schemas/ratingSummary')

const updateRating = async (_req, _res) => {
    const schema = Joi.object({
        ratingId: Joi.string().required().messages({
            'any.required': 'ratingId is required',
            'string.base': 'ratingId must be a string',
        }),
        userCount: Joi.number().min(0),
        categoryCount: Joi.number().min(0),
        yearCount: Joi.number().min(0),
        rating: Joi.number().min(0).max(5),
    });

    const { error: customError, value } = schema.validate({..._req.body}, { abortEarly: false });
    if (customError) {
        return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
    }
    try {
        const summary = await RatingSummary.findById(value.ratingId);

        if (!summary) {
            return _res.status(404).json({ success: false, message: 'Rating summary not found' });
        }

        Object.assign(summary, value);
        summary.updatedAt = Date.now();
        await summary.save();

        return _res.status(200).json({ success: true, data: summary });
    } catch (err) {
        return _res.status(500).json({ success: false, message: err.message });
    }
};


const getRating = async (_req, _res) => {
    try {
        const summaries = await RatingSummary.find();
        return _res.status(200).json(success(summaries, "Rating Summaries"));
    } catch (err) {
        return _res.status(500).json(error(500, error.message));
    }
}

module.exports = { updateRating, getRating }