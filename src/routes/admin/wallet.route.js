const express = require("express");
const WalletRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createWalletOrder, verifyWalletPayment, getWalletHistory } = require("../../controllers/v1/recharge");

WalletRouter.get('/', asyncHandler(getWalletHistory));
WalletRouter.post('/create-order', asyncHandler(createWalletOrder));
WalletRouter.put('/verify', asyncHandler(verifyWalletPayment));
module.exports = WalletRouter;
