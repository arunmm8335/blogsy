// Script to test draft access by ID
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';
import User from '../models/User.js';

dotenv.config();

const testDraftAccess = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Find all drafts
        console.log('\n📋 All drafts in database:');
        const drafts = await Post.find({ status: 'draft' }).select('_id title authorId createdAt');

        if (drafts.length === 0) {
            console.log('No drafts found in database');
            return;
        }

        drafts.forEach((draft, index) => {
            console.log(`${index + 1}. ID: ${draft._id} | Title: "${draft.title}" | Author: ${draft.authorId} | Created: ${draft.createdAt}`);
        });

        // Test accessing the first draft by ID
        if (drafts.length > 0) {
            const firstDraft = drafts[0];
            console.log(`\n🧪 Testing access to draft: ${firstDraft._id}`);

            const foundPost = await Post.findById(firstDraft._id).populate('authorId', 'username profilePicture');

            if (foundPost) {
                console.log('✅ Draft found successfully!');
                console.log('Post details:', {
                    id: foundPost._id,
                    title: foundPost.title,
                    status: foundPost.status,
                    authorId: foundPost.authorId
                });
            } else {
                console.log('❌ Draft not found by ID');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
};

// Run the script
testDraftAccess(); 