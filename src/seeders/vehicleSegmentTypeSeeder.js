const mongoose = require('mongoose');
const { VehicleSegmentTypeModel } = require('../schemas/VehicleSegmentType ');
const { dbConnect } = require('../config/dbConnect');


const seedVehicleSegmentTypes = async () => {

  const data = [
    {
      name: "Heavy commercial vehicle",
      icon: "",
    },
    {
      name: "Tractor parts",
      icon: "",
    },
    {
      name: "passenger car",
      icon: "",
    },
    {
      name: "Two wheeler",
      icon: "",
    },
    {
      name: "Three wheeler",
      icon: "",
    },
    {
      name: "Industrial use",
      icon: "",
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
