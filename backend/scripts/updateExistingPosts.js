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

const updateExistingPosts = async () => {
    try {
        console.log('Connected to Supabase');

        const { data: postsWithoutStatus, error: findError } = await supabase
            .from('posts')
            .select('id')
            .is('status', null);

        if (findError) {
            throw findError;
        }

        console.log(`Found ${postsWithoutStatus.length} posts without status field`);

        if (postsWithoutStatus.length === 0) {
            console.log('All posts already have status field');
            return;
        }

        const idsToUpdate = postsWithoutStatus.map((post) => post.id);
        const { data: updatedRows, error: updateError } = await supabase
            .from('posts')
            .update({
                status: 'published',
                updated_at: new Date().toISOString(),
            })
            .in('id', idsToUpdate)
            .select('id');

        if (updateError) {
            throw updateError;
        }

        console.log(`Updated ${updatedRows.length} posts with status: 'published'`);

        const { data: remainingPostsWithoutStatus, error: remainingError } = await supabase
            .from('posts')
            .select('id')
            .is('status', null);

        if (remainingError) {
            throw remainingError;
        }

        console.log(`Posts without status field after update: ${remainingPostsWithoutStatus.length}`);

    } catch (error) {
        console.error('Error updating posts:', error);
    }
};

// Run the script
updateExistingPosts(); 