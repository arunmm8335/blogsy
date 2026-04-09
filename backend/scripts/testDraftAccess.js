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

const testDraftAccess = async () => {
    try {
        console.log('Connected to Supabase');

        // Find all drafts
        console.log('\n📋 All drafts in database:');
        const { data: drafts, error: draftsError } = await supabase
            .from('posts')
            .select('id, title, author_id, created_at')
            .eq('status', 'draft')
            .order('created_at', { ascending: true });

        if (draftsError) {
            throw draftsError;
        }

        if (drafts.length === 0) {
            console.log('No drafts found in database');
            return;
        }

        drafts.forEach((draft, index) => {
            console.log(`${index + 1}. ID: ${draft.id} | Title: "${draft.title}" | Author: ${draft.author_id} | Created: ${draft.created_at}`);
        });

        // Test accessing the first draft by ID
        if (drafts.length > 0) {
            const firstDraft = drafts[0];
            console.log(`\n🧪 Testing access to draft: ${firstDraft.id}`);

            const { data: foundPost, error: postError } = await supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    status,
                    author_id,
                    users!posts_author_id_fkey(id, username, profile_picture)
                `)
                .eq('id', firstDraft.id)
                .maybeSingle();

            if (postError) {
                throw postError;
            }

            if (foundPost) {
                console.log('✅ Draft found successfully!');
                console.log('Post details:', {
                    id: foundPost.id,
                    title: foundPost.title,
                    status: foundPost.status,
                    authorId: foundPost.users
                        ? {
                            id: foundPost.users.id,
                            username: foundPost.users.username,
                            profilePicture: foundPost.users.profile_picture || '',
                        }
                        : foundPost.author_id
                });
            } else {
                console.log('❌ Draft not found by ID');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
};

// Run the script
testDraftAccess(); 