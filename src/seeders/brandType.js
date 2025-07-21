const mongoose = require('mongoose');
const { BrandTypeModel } = require('../schemas/brandTypes')
const seedBrandTypes = async () => {
    const data = [
        { name: "Vehicle" },
        { name: "Spare Parts" },
        { name: "Vehicle + Spare Parts" }
    ];

    try {
        // await dbConnect();
        await BrandTypeModel.deleteMany();
        await BrandTypeModel.insertMany(data);
        console.log('✅ BrandTypes seeded successfully');
    } catch (err) {
        console.error('❌ Error seeding BrandTypes:', err);
    }
}

module.exports = seedBrandTypes;