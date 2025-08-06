const express = require("express");
const pointsRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { getPoints } = require("../../controllers/v1/points");

pointsRouter.get('/', asyncHandler(getPoints));
module.exports = pointsRouter;
