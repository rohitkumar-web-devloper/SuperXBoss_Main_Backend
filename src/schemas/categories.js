const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        default: ""
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    role: {
        type: String,
        default: "admin"
    },
    address: {
        type: String,
        default: null
    },
    mobile: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    whatsapp: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    countryCode: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    type: {
        type: String,
        default: "vendor"
    },
    token: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true,
        index: true,
    },
    password: {
        type: String,
        validate: {
            validator: function (value) {
                if (this.type !== "customer") {
                    return typeof value === "string" && value.trim().length > 0;
                }
                return true;
            },
            message: "Password is required for non-customer users"
        }
    },
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const CategoryModal = mongoose.model('categories', CategorySchema);
module.exports = { CategoryModal }
