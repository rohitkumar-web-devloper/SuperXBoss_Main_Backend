const mongoose = require('mongoose');

const brandCategoriesSchema = new mongoose.Schema(
    {
        brand_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'brands',
            required: true,
        },
        categories: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categories',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const BrandCategoriesModel = mongoose.model('brands_categories', brandCategoriesSchema);
module.exports = { BrandCategoriesModel };
