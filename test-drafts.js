// Simple test script for draft functionality
// Run this with: node test-drafts.js

const API_BASE = 'http://localhost:5000/api';

// Test data
const testDraft = {
    title: 'Test Draft Post',
    content: '<p>This is a test draft post content.</p>',
    tags: 'test,draft,api',
    status: 'draft'
};

async function testDraftAPI() {
    console.log('🧪 Testing Draft API Endpoints...\n');

    try {
        // Test 1: Create a draft
        console.log('1️⃣ Testing draft creation...');
        const createResponse = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: You'll need to add a valid token here for testing
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
            },
            body: JSON.stringify(testDraft)
        });

        if (createResponse.ok) {
            const createdPost = await createResponse.json();
            console.log('✅ Draft created successfully:', createdPost._id);

            // Test 2: Get drafts (requires authentication)
            console.log('\n2️⃣ Testing get drafts endpoint...');
            const draftsResponse = await fetch(`${API_BASE}/posts/drafts`);
            console.log('Drafts endpoint status:', draftsResponse.status);

            // Test 3: Publish draft (requires authentication)
            console.log('\n3️⃣ Testing publish draft endpoint...');
            const publishResponse = await fetch(`${API_BASE}/posts/${createdPost._id}/publish`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
                }
            });
            console.log('Publish endpoint status:', publishResponse.status);

        } else {
            console.log('❌ Draft creation failed:', createResponse.status);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    console.log('\n📝 Manual Testing Steps:');
    console.log('1. Login to your account');
    console.log('2. Go to Create Post page');
    console.log('3. Fill in title and content');
    console.log('4. Click "Save as Draft"');
    console.log('5. Go to Drafts page to verify');
    console.log('6. Test Edit, Publish, and Delete actions');
}

// Run the test
testDraftAPI(); 