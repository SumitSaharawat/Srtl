// seedAdmin.js
require('dotenv').config(); // Loads properties from .env
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/admin.models');

const seedInitialAdmin = async () => {
    try {
        // Grab credentials safely from environment parameters
        const desiredUsername = process.env.INIT_ADMIN_USERNAME;
        const rawPassword = process.env.INIT_ADMIN_PASSWORD;

        // Safety Guard: Abort if variables are missing in .env
        if (!desiredUsername || !rawPassword) {
            console.error('❌ Error: INIT_ADMIN_USERNAME or INIT_ADMIN_PASSWORD is missing in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Check if user already exists
        const existingAdmin = await Admin.findOne({ username: desiredUsername });
        if (existingAdmin) {
            console.log(`Admin profile '${desiredUsername}' is already provisioned.`);
            process.exit(0);
        }

        // Hash the password cleanly
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const newAdmin = new Admin({
            username: desiredUsername,
            password: hashedPassword
        });

        await newAdmin.save();
        console.log('🎉 Success! Admin profile securely seeded from environment variables.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding process failed:', error);
        process.exit(1);
    }
};

seedInitialAdmin();