const mongoose = require('mongoose');
const { VehicleSegmentTypeModel } = require('../schemas/VehicleSegmentType ');
const { dbConnect } = require('../config/dbConnect');


const seedVehicleSegmentTypes = async () => {

  const data = [
    {
      name: "Heavy commercial vehicle",
      icon: "default-image.jpg",
    },
    {
      name: "Tractor parts",
      icon: "default-image.jpg",
    },
    {
      name: "passenger car",
      icon: "default-image.jpg",
    },
    {
      name: "Two wheeler",
      icon: "default-image.jpg",
    },
    {
      name: "Three wheeler",
      icon: "default-image.jpg",
    },
    {
      name: "Industrial use",
      icon: "default-image.jpg",
    },
  ];

  try {
    await VehicleSegmentTypeModel.deleteMany(); // Optional: Clear existing entries
    await VehicleSegmentTypeModel.insertMany(data);
    console.log('✅ VehicleSegmentTypes seeded successfully');
  } catch (err) {
    console.error('❌ Error seeding VehicleSegmentTypes:', err);
  }
};

module.exports = seedVehicleSegmentTypes
