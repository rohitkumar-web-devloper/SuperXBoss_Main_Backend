const express = require("express");
const categoryRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createCategory, updateCategory, getCategories, getBrandCategories } = require("../../controllers/v1/category");
const { upload, compressImage } = require("../../middleware/upload");

// Assuming userController.login is a function
categoryRouter.post('/', upload.single("picture"), compressImage, asyncHandler(createCategory));
categoryRouter.put('/:id', upload.single("picture"), asyncHandler(updateCategory));
categoryRouter.get('/', asyncHandler(getCategories));
categoryRouter.get('/brand/:brand_id', asyncHandler(getBrandCategories));


// Direct export (CommonJS style)
module.exports = categoryRouter;
