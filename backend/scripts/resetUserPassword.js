// Script to reset a user's password
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const resetUserPassword = async (email, newPassword) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Find the user
        const user = await User.findOne({ email: email });

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            return;
        }

        console.log(`✅ Found user: ${user.username} (${user.email})`);

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update the password
    user.password = hashedPassword;
    
    // Ensure socialLinks is properly initialized
    if (!user.socialLinks) {
      user.socialLinks = {
        twitter: '',
        github: '',
        website: '',
        linkedin: ''
      };
    }
    
    await user.save();

        console.log(`✅ Password updated successfully for ${user.username}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 New password: ${newPassword}`);
        console.log('\n💡 You can now login with this email and password');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
};

// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.log('Usage: node scripts/resetUserPassword.js <email> <new_password>');
    console.log('\nExample: node scripts/resetUserPassword.js arunmyageri@gmail.com mynewpassword123');
    console.log('\nAvailable emails:');
    console.log('- arunmyageri1916@gmail.com');
    console.log('- arunmmyageri.221cs113@nitk.edu.in');
    console.log('- arunmyageri26@gmail.com');
    console.log('- arunmyageri@gmail.com');
} else {
    resetUserPassword(email, newPassword);
} 