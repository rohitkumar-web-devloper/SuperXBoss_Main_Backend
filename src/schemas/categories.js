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
        default: ""
    },

    featured: {
        type: Boolean,
        default: false,
        index: true,
    },
    status: {
        type: Boolean,
        default: false,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', // reference to User model
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', // reference to User model
    },
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const CategoryModal = mongoose.model('categories', CategorySchema);
module.exports = { CategoryModal }
