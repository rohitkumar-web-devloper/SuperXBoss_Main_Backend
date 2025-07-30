const express = require("express");
const WishListRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createWishList, getWishList } = require("../../controllers/v1/wish-list");

WishListRouter.post('/', asyncHandler(createWishList));
WishListRouter.get('/', asyncHandler(getWishList));
module.exports = WishListRouter;
