const express = require("express");
const addressRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createFAQ, updateFAQ, getFAQs } = require("../../controllers/v1/faq");
const { createAddress } = require("../../controllers/v1/address");

addressRouter.post('/', asyncHandler(createAddress));
addressRouter.put('/:faqId', asyncHandler(updateFAQ));
addressRouter.get('/', asyncHandler(getFAQs));
module.exports = addressRouter;
