const mongoose = require('mongoose');
const { VehicleSegmentTypeModel } = require('../schemas/VehicleSegmentType ');
const { dbConnect } = require('../config/dbConnect');


const seedVehicleSegmentTypes = async () => {

  const data = [
    {
      name: "heavy commercial vehicle",
      icon: "default-image.jpg",
    },
    {
      name: "tractor parts",
      icon: "default-image.jpg",
    },
    {
      name: "passenger car",
      icon: "default-image.jpg",
    },
    {
      name: "two wheeler",
      icon: "default-image.jpg",
    },
    {
      name: "three wheeler",
      icon: "default-image.jpg",
    },
    {
      name: "industrial use",
      icon: "default-image.jpg",
    },
  ];

  try {
    await VehicleSegmentTypeModel.deleteMany(); // Optional: Clear existing entries
    await VehicleSegmentTypeModel.insertMany(data);
    console.log('✅ VehicleSegmentTypes seeded successfully');
  } catch (err) {
    console.error('❌ Error seeding VehicleSegmentTypes:', err);
  } finally {
    await mongoose.disconnect();
  }
};

module.exports = seedVehicleSegmentTypes
