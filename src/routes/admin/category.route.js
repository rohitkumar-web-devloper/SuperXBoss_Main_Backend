const express = require("express");
const categoryRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createCategory, updateCategory, getCategories, getNestedCategories } = require("../../controllers/v1/category");
const { upload } = require("../../middleware/upload");

// Assuming userController.login is a function
categoryRouter.post('/', upload.single("picture"), asyncHandler(createCategory));
categoryRouter.put('/:id', upload.single("picture"), asyncHandler(updateCategory));
categoryRouter.get('/', asyncHandler(getCategories));


// Direct export (CommonJS style)
module.exports = categoryRouter;
