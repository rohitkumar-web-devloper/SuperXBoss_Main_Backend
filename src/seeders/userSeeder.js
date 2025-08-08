const { hashPassword } = require('../Helper/index');
const { UserModal } = require('../schemas/user');

async function runSeeder() {
    try {
        const existingUser = await UserModal.findOne({ email: 'admin@example.com' });

        if (existingUser) {
            console.log('⚠️ Admin user already exists. Skipping...');
            return;
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
            type: 'vendor',
        });
        newUser.createdBy = newUser?._id

        await newUser.save();
        console.log('✅ Admin user created successfully.');
    } catch (err) {
        console.error('❌ Seeder error (userSeeder):', err);
        throw err; // let the main script handle it
    }
}

module.exports = runSeeder;
