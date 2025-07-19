const { dbConnect } = require('../config/dbConnect');
const { hashPassword } = require('../Helper/index')
const { UserModal } = require('../schemas/user')
const pathName = `.env.${process.env.NODE_ENV || 'development'}`;
require("dotenv").config({ path: pathName });
async function runSeeder() {
    try {
        dbConnect()
        // Check if user already exists
        const existingUser = await UserModal.findOne({ email: 'admin@example.com' });
        if (existingUser) {
            console.log('Admin user already exists. Skipping...');
            return process.exit(0);
        }

        const hashedPassword = await hashPassword('admin123');

        const newUser = new UserModal({
            name: 'Admin User',
            profile: '',
            mobile: '9999999999',
            whatsapp: '9999999999',
            countryCode: '+91',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            type: 'vendor'
        });

        await newUser.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seeder error:', err);
        process.exit(1);
    }
}

runSeeder();
