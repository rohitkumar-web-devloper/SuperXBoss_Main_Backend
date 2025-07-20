const express = require("express");
const bannerRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { authenticateUser } = require("../../middleware/authenticateUser");
const { upload } = require("../../middleware/upload");
const { createBanner, updateBanner, getBanners } = require("../../controllers/v1/banner");
bannerRouter.post('/', upload.single('image'), asyncHandler(createBanner));
bannerRouter.put('/', upload.single('image'), asyncHandler(updateBanner));
bannerRouter.get('/', asyncHandler(getBanners));

module.exports = bannerRouter;
