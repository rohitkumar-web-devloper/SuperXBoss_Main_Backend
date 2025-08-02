const express = require("express");
const brandRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createBrand, updateBrand, getBrands, getActiveBrands, getBrandsWithVehicle, getBrandNestedCategories, getActiveBrandCategories } = require("../../controllers/v1/brand");
const { upload } = require("../../middleware/upload");
brandRouter.post('/', upload.single('logo'), asyncHandler(createBrand));
brandRouter.put('/:id', upload.single('logo'), asyncHandler(updateBrand));
brandRouter.get('/', asyncHandler(getBrands));
brandRouter.get('/vehicle', asyncHandler(getBrandsWithVehicle));
brandRouter.get('/active', asyncHandler(getActiveBrands));
brandRouter.get('/with-categories', asyncHandler(getActiveBrandCategories));
brandRouter.get('/nested', asyncHandler(getBrandNestedCategories));

module.exports = brandRouter;
