const express = require("express");
const userRouter = express.Router();
const { createUser, loginUser, updateUser, logoutUser } = require('../../controllers/v1/user');
const { asyncHandler } = require("../../middleware/error-handler");
const { authenticateUser } = require("../../middleware/authenticateUser");

// Assuming userController.login is a function
userRouter.post('/login', asyncHandler(loginUser));
userRouter.post('/logout', authenticateUser, asyncHandler(logoutUser));
userRouter.post('/user', authenticateUser, asyncHandler(createUser));
userRouter.put('/user', asyncHandler(updateUser));

// Direct export (CommonJS style)
module.exports = userRouter;
