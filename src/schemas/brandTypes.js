const mongoose = require('mongoose');

const brandTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
    },
}, { timestamps: true });

const BrandTypeModel = mongoose.model('brand_types', brandTypeSchema);

module.exports = { BrandTypeModel };