const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    picture: {
        type: String,
        default: ""
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    description: {
        type: String,
        default: "admin"
    },

    featured: {
        type: Boolean,
        default: false,
        index: true,
    },
    trending: {
        type: String,
        default: "",
    },
    sorting: {
        type: String,
        default: "",
    },

    status: {
        type: Boolean,
        default: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const CategoryModal = mongoose.model('categories', CategorySchema);
module.exports = { CategoryModal }
