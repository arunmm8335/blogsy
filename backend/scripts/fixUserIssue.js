// Script to diagnose and fix user authentication issues
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const fixUserIssue = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // 1. List all users to see what's in the database
        console.log('\n📋 All users in database:');
        const allUsers = await User.find({}).select('username email createdAt');
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. Username: "${user.username}" | Email: "${user.email}" | Created: ${user.createdAt}`);
        });

        // 2. Check for duplicate emails (case insensitive)
        console.log('\n🔍 Checking for email duplicates...');
        const emails = allUsers.map(u => u.email.toLowerCase());
        const uniqueEmails = [...new Set(emails)];

        if (emails.length !== uniqueEmails.length) {
            console.log('❌ Found duplicate emails (case insensitive):');
            const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
            console.log('Duplicates:', [...new Set(duplicates)]);
        } else {
            console.log('✅ No duplicate emails found');
        }

        // 3. Check for duplicate usernames (case insensitive)
        console.log('\n🔍 Checking for username duplicates...');
        const usernames = allUsers.map(u => u.username.toLowerCase());
        const uniqueUsernames = [...new Set(usernames)];

        if (usernames.length !== uniqueUsernames.length) {
            console.log('❌ Found duplicate usernames (case insensitive):');
            const duplicates = usernames.filter((username, index) => usernames.indexOf(username) !== index);
            console.log('Duplicates:', [...new Set(duplicates)]);
        } else {
            console.log('✅ No duplicate usernames found');
        }

        // 4. Interactive fix options
        console.log('\n🛠️  Fix Options:');
        console.log('1. Delete all users and start fresh');
        console.log('2. Fix specific user (enter email)');
        console.log('3. Reset password for specific user');
        console.log('4. Exit');

        // For now, let's just show the data
        console.log('\n💡 Recommendations:');
        console.log('- If you see duplicate emails/usernames, you may need to clean up the database');
        console.log('- Try registering with a completely different email address');
        console.log('- Check if there are any spaces or special characters in your email');
        console.log('- Make sure you\'re using the exact same email for both registration and login');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
};

// Run the script
fixUserIssue(); 