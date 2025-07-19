const express = require("express");
const userRouter = express.Router();
const { createUser, loginUser, updateUser } = require('../../controllers/v1/user');
const { asyncHandler } = require("../../middleware/error-handler");

// Assuming userController.login is a function
userRouter.post('/login', asyncHandler(loginUser));
userRouter.post('/user', asyncHandler(createUser));
userRouter.put('/user', asyncHandler(updateUser));

// Direct export (CommonJS style)
module.exports = userRouter;
