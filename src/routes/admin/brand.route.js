const express = require("express");
const brandRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { authenticateUser } = require("../../middleware/authenticateUser");
const { createBrand, updateBrand, getBrands, getActiveBrands } = require("../../controllers/v1/brand");
const { upload } = require("../../middleware/upload");
brandRouter.post('/', upload.single('logo'), asyncHandler(createBrand));
brandRouter.put('/:id', upload.single('logo'), asyncHandler(updateBrand));
brandRouter.get('/', asyncHandler(getBrands));
brandRouter.get('/active', asyncHandler(getActiveBrands));

module.exports = brandRouter;
