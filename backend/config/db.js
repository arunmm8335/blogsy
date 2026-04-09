// In config/db.js
import dotenv from 'dotenv';
import { getSupabaseClient } from './supabase.js';

dotenv.config();

export const getDbProvider = () => (process.env.DB_PROVIDER || 'supabase').toLowerCase();

const connectDB = async () => {
  try {
    const dbProvider = getDbProvider();

    if (dbProvider !== 'supabase') {
      throw new Error('Unsupported DB_PROVIDER. This backend is configured for Supabase only.');
    }

    getSupabaseClient();
    console.log('Supabase client initialized successfully.');
  } catch (error) {
    console.error('Database connection error:', error);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;