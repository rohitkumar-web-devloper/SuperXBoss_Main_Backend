const express = require("express");
const recentViewRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createRecentHistory, getRecentViewHistory } = require("../../controllers/v1/recent-view");

recentViewRouter.post('/', asyncHandler(createRecentHistory));
recentViewRouter.get('/', asyncHandler(getRecentViewHistory));
module.exports = recentViewRouter;
