const express = require("express");
const brandRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { authenticateUser } = require("../../middleware/authenticateUser");
const { createBrand, updateBrand, getBrands } = require("../../controllers/v1/brand");
const { upload } = require("../../middleware/upload");
const { brandValidation } = require("../../functions/dataValidation/brand");
brandRouter.post('/', upload.single('logo'),brandValidation, asyncHandler(createBrand));
brandRouter.put('/', upload.single('logo'), asyncHandler(updateBrand));
brandRouter.get('/', authenticateUser, asyncHandler(getBrands));

module.exports = brandRouter;
