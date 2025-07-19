const express = require("express");
const categoryRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createCategory } = require("../../controllers/v1/category");
const { upload } = require("../../middleware/upload");

// Assuming userController.login is a function
categoryRouter.post('/category', upload.single("picture"), asyncHandler(createCategory));


// Direct export (CommonJS style)
module.exports = categoryRouter;
