const mongoose = require('mongoose');

const dbConnect = async () => {
    try {
        // await mongoose.connect(process.env.MONGO_URL, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // });
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ MongoDB connected Successfully.');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

module.exports = { dbConnect };
