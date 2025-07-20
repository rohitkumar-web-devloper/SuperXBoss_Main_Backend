const runSeeder = require("./userSeeder");
const seedVehicleSegmentTypes = require("./vehicleSegmentTypeSeeder");
const { dbConnect } = require('../config/dbConnect');
const mongoose = require("mongoose");

// Load environment variables
const pathName = `.env.${process.env.NODE_ENV || 'development'}`;
require("dotenv").config({ path: pathName });

const runAllSeeders = async () => {
    try {
        // Step 1: Connect to MongoDB
        await dbConnect();

        // Step 2: Run seeders in parallel
        await Promise.all([
            runSeeder(),
            seedVehicleSegmentTypes(),
        ]);

        console.log("✅ All seeders executed successfully.");

        // Step 3: Close MongoDB connection
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");

        process.exit(0); // Exit after success
    } catch (error) {
        console.error("❌ Error while running seeders:", error);
        process.exit(1);
    }
};

runAllSeeders();
