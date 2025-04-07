const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../backend/models/User');

async function createAdmin() {
    try {
        console.log('Attempting to connect to:', process.env.MONGODB_URI); // Debug log
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ schoolId: 'admin123' });
        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const admin = await User.create({
            schoolId: 'admin123',
            password: 'admin123',
            fullName: 'System Administrator',
            role: 'admin'
        });

        console.log('Admin user created successfully:', admin);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();