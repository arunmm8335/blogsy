// Script to update existing posts to have status field
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';

dotenv.config();

const updateExistingPosts = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Find all posts that don't have a status field
        const postsWithoutStatus = await Post.find({ status: { $exists: false } });

        console.log(`Found ${postsWithoutStatus.length} posts without status field`);

        if (postsWithoutStatus.length === 0) {
            console.log('All posts already have status field');
            return;
        }

        // Update all posts to have status: 'published'
        const result = await Post.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'published' } }
        );

        console.log(`Updated ${result.modifiedCount} posts with status: 'published'`);

        // Verify the update
        const remainingPostsWithoutStatus = await Post.find({ status: { $exists: false } });
        console.log(`Posts without status field after update: ${remainingPostsWithoutStatus.length}`);

    } catch (error) {
        console.error('Error updating posts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the script
updateExistingPosts(); 