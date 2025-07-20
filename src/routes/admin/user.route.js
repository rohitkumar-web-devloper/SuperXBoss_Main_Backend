const express = require("express");
const userRouter = express.Router();
const { createUser, loginUser, updateUser, logoutUser, getUser } = require('../../controllers/v1/user');
const { asyncHandler } = require("../../middleware/error-handler");
const { authenticateUser } = require("../../middleware/authenticateUser");
const { upload } = require("../../middleware/upload");
// Assuming userController.login is a function
userRouter.post('/login', asyncHandler(loginUser));
userRouter.post('/logout', authenticateUser, asyncHandler(logoutUser));
userRouter.post('/user', authenticateUser, upload.single('profile'), asyncHandler(createUser));
userRouter.put('/user', authenticateUser, upload.single('profile'), asyncHandler(updateUser));
userRouter.get('/users', authenticateUser, asyncHandler(getUser));

// Direct export (CommonJS style)
module.exports = userRouter;
