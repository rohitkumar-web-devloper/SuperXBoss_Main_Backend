const express = require("express");
const brandRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { authenticateUser } = require("../../middleware/authenticateUser");
const { createBrand, updateBrand, getBrands } = require("../../controllers/v1/brand");
const { upload } = require("../../middleware/upload");
brandRouter.post('/', upload.single('logo'), authenticateUser, asyncHandler(createBrand));
brandRouter.put('/', upload.single('logo'), authenticateUser, asyncHandler(updateBrand));
// brandRouter.get('/:id', authenticateUser, asyncHandler(getUser));
brandRouter.get('/brands', authenticateUser, asyncHandler(getBrands));

module.exports = brandRouter;
