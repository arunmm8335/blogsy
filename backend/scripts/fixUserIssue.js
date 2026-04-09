import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

const fixUserIssue = async () => {
    try {
        console.log('Connected to Supabase');

        // 1. List all users to see what's in the database
        console.log('\n📋 All users in database:');
        const { data: allUsers, error: usersError } = await supabase
            .from('users')
            .select('id, username, email, created_at')
            .order('created_at', { ascending: true });

        if (usersError) {
            throw usersError;
        }

        if (!allUsers || allUsers.length === 0) {
            console.log('No users found.');
            return;
        }

        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. Username: "${user.username}" | Email: "${user.email}" | Created: ${user.created_at}`);
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
    }
};

// Run the script
fixUserIssue(); 