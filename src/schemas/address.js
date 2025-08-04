const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const addressSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: 'users', // or 'customers', depending on your project
            required: true,
            index: true
        },

        label: {
            type: String,
            enum: ['home', 'work', 'other'],
            default: 'home'
        },

        name: { type: String, required: true, trim: true },
        mobile: { type: String, required: true, trim: true },

        // Address fields
        addressLine1: { type: String, required: true, trim: true },
        addressLine2: { type: String, trim: true },
        landmark: { type: String, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true },
        country: { type: String, default: 'India', trim: true },

        // Coordinates (optional, useful for delivery)
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: undefined
            }
        },

        isDefault: { type: Boolean, default: false }, // mark primary address
        type: { type: String, enum: ['shipping', 'billing', 'both'], default: 'shipping' },

        meta: { type: Schema.Types.Mixed, default: {} } // optional extra info
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id?.toString();
                delete ret._id;
                return ret;
            }
        },
        toObject: { virtuals: true }
    }
);

// Optional geospatial index if location is used
addressSchema.index({ location: '2dsphere' });

const AddressModel = mongoose.models.addresses || mongoose.model('addresses', addressSchema);

module.exports = { AddressModel };
