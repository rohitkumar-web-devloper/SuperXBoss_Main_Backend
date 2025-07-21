const express = require("express");
const ratingRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { updateRating, getRating } = require("../../controllers/v1/ratingSummery");

ratingRouter.put('/', asyncHandler(updateRating));
ratingRouter.get('/', asyncHandler(getRating));
module.exports = ratingRouter;
