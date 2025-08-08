const express = require("express");
const AddToCartRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createAddToCartList, getAddToCartList } = require("../../controllers/v1/add-to-cart");

AddToCartRouter.post('/', asyncHandler(createAddToCartList));
AddToCartRouter.get('/', asyncHandler(getAddToCartList));
module.exports = AddToCartRouter;
