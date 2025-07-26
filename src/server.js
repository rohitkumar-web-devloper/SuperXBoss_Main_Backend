const pathName = `.env.${process.env.NODE_ENV || 'development'}`;
require("dotenv").config({ path: pathName });

const path = require('path');
const express = require("express");
const { requestLogger, addTimeStamp } = require("./middleware/customMiddleware");
const { globalErrorhandler } = require("./middleware/error-handler");
const { dbConnect } = require("./config/dbConnect");
const { createBaseRateLimit } = require("./middleware/rate-limit");
const { router } = require("./routes/index.route");
const { configureCors } = require("./config/corsConfig");
const { baseUploadPath } = require("./functions/imageUpload");
const { cronCoupon } = require("./Helper/CronTabCouponStatus");
// const { baseUploadPath } = require("./middleware/upload");

const app = express();
const PORT = process.env.PORT || 4004; // Fallback in case env is missing
// Custom middlewares
app.use(configureCors())
app.use(requestLogger);
app.use(createBaseRateLimit(1 * 60 * 1000, 100));
app.use(addTimeStamp);

// Built-in middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically ✅
console.log("🛣️ Serving uploads from:", baseUploadPath);
app.use('/uploads', express.static(baseUploadPath));

// Main router
app.use('/api', router);

// Error handling middleware
app.use(globalErrorhandler);

// Start server
app.listen(PORT, () => {
    console.log(`✅Service is listening on http://localhost:${PORT}`);
});

// Connect DB
dbConnect();
cronCoupon()
