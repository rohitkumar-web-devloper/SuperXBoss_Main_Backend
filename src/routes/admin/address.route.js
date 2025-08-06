const express = require("express");
const addressRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createAddress, updateAddressStatus, gerAddresses } = require("../../controllers/v1/address");

addressRouter.post('/', asyncHandler(createAddress));
addressRouter.put('/status/:id', asyncHandler(updateAddressStatus));
addressRouter.get('/', asyncHandler(gerAddresses));
module.exports = addressRouter;
