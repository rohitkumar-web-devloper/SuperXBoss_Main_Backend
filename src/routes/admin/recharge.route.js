const express = require("express");
const rechargeRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { updateWallet, createWallet, getWallet } = require("../../controllers/v1/wallet");

rechargeRouter.put('/:recharge', asyncHandler(updateWallet));
rechargeRouter.post('/', asyncHandler(createWallet));
rechargeRouter.get('/', asyncHandler(getWallet));
module.exports = rechargeRouter;
