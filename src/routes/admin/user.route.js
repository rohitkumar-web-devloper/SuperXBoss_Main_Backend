const express = require("express");
const userRouter = express.Router();
const { createUser, loginUser, updateUser, logoutUser, getUser } = require('../../controllers/v1/user');
const { asyncHandler } = require("../../middleware/error-handler");
const { authenticateUser } = require("../../middleware/authenticateUser");
const { upload } = require("../../middleware/upload");
// Assuming userController.login is a function
userRouter.post('/login', asyncHandler(loginUser));
userRouter.post('/logout', authenticateUser, asyncHandler(logoutUser));
userRouter.post('/user', upload.single('profile'), authenticateUser, asyncHandler(createUser));
userRouter.put('/user', upload.single('profile'), authenticateUser, asyncHandler(updateUser));
userRouter.get('/user', authenticateUser, asyncHandler(getUser));

// Direct export (CommonJS style)
module.exports = userRouter;
