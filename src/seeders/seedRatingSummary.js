const mongoose = require('mongoose');
const { RatingSummary } = require('../schemas/ratingSummary');

async function seedRatingSummary() {
    try {
        // Delete all existing RatingSummary documents
        await RatingSummary.deleteMany({});
        console.log('All existing RatingSummary documents deleted.');

        // Insert one default document
        const defaultData = new RatingSummary({
            userCount: 0,
            categoryCount: 0,
            yearCount: 0,
            rating: 0,
        });

        await defaultData.save();
        console.log('New RatingSummary inserted successfully.');
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

// Call the function
module.exports = { seedRatingSummary }