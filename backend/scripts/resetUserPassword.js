import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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

const resetUserPassword = async (email, newPassword) => {
    try {
        console.log('Connected to Supabase');

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('email', email)
            .maybeSingle();

        if (userError) {
            throw userError;
        }

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            return;
        }

        console.log(`✅ Found user: ${user.username} (${user.email})`);

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hash: hashedPassword,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        console.log(`✅ Password updated successfully for ${user.username}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 New password: ${newPassword}`);
        console.log('\n💡 You can now login with this email and password');

    } catch (error) {
        console.error('Error:', error);
    }
};

// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.log('Usage: node scripts/resetUserPassword.js <email> <new_password>');
    console.log('\nExample: node scripts/resetUserPassword.js user@example.com mynewpassword123');
} else {
    resetUserPassword(email, newPassword);
} 