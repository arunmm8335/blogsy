// In config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;