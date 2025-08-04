const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        set: {
            type: Number,
            required: true,
        },
        pc: {
            type: Number,
        },
        status: {
            type: Boolean,
            default: false,
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

const UnitModel = mongoose.model('units', UnitSchema);
module.exports = { UnitModel };
