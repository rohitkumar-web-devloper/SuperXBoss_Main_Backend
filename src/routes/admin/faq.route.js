const express = require("express");
const faqRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createFAQ, updateFAQ, getFAQs } = require("../../controllers/v1/faq");

faqRouter.post('/', asyncHandler(createFAQ));
faqRouter.put('/:faqId', asyncHandler(updateFAQ));
faqRouter.get('/', asyncHandler(getFAQs));
module.exports = faqRouter;
