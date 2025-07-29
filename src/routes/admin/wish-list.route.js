const express = require("express");
const WishListRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createUnit, updateUnit, getUnits } = require("../../controllers/v1/unit");
const { createWishList, getWishList } = require("../../controllers/v1/wish-list");

WishListRouter.put('/:unit', asyncHandler(updateUnit));
WishListRouter.post('/', asyncHandler(createWishList));
WishListRouter.get('/', asyncHandler(getWishList));
module.exports = WishListRouter;
