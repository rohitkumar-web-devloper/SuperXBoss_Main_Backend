const mongoose = require('mongoose');

const VehicleProductSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true,
            index: true
        },
        brand_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'brands',
            required: true,
            index: true
        },
        vehicle_ids: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'vehicles',
            required: true,
            index: true
        },
        categories: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'categories',
            index: true
        },
        status: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
    },
    {
        versionKey: false,
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const VehicleProductModel = mongoose.model('vehicle-products', VehicleProductSchema);
module.exports = { VehicleProductModel };
