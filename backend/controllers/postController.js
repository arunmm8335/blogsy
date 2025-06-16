import Post from '../models/Post.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (make sure your .env file has these variables)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Reusable helper function to upload a file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
              folder: "blogsy_media", // A dedicated folder in your Cloudinary account
              resource_type: resourceType
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
    const { title, content, tags } = req.body;
    if (!title || !content) {
        res.status(400);
        return next(new Error('Title and content are required'));
    }

    try {
        let media = [];
        let coverImage = '';

        // --- THIS IS THE FIX: Use req.files (plural) ---
        // It correctly handles an array of files from multer
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                uploadToCloudinary(file.buffer, file.mimetype.startsWith('video') ? 'video' : 'auto')
            );
            const uploadResults = await Promise.all(uploadPromises);
            
            media = uploadResults.map(result => ({
                url: result.secure_url,
                public_id: result.public_id,
                fileType: result.resource_type
            }));

            if (media.length > 0) {
                coverImage = media[0].url;
            }
        }
        
        const newPost = new Post({
            title, content,
            tags: tags ? tags.split(',').filter(tag => tag.trim() !== '') : [],
            authorId: req.user.id,
            coverImage, // Set the cover image
            media,      // Set the full media array
        });

        const createdPost = await newPost.save();
        res.status(201).json(createdPost);
    } catch (error) {
        console.error("Error creating post:", error);
        next(error);
    }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Author only)
export const updatePost = async (req, res, next) => {
    try {
        // Step 1: Find the original post to get media details and check ownership
        const originalPost = await Post.findById(req.params.id);
        if (!originalPost) {
            res.status(404);
            return next(new Error('Post not found'));
        }
        if (originalPost.authorId.toString() !== req.user.id.toString()) {
            res.status(403);
            return next(new Error('User not authorized'));
        }

        const { title, content, tags, existingMediaUrls } = req.body;

        // Step 2: Handle Cloudinary media operations (deletions and uploads)
        const urlsToKeep = existingMediaUrls ? JSON.parse(existingMediaUrls) : [];
        const mediaToDelete = originalPost.media.filter(item => !urlsToKeep.includes(item.url));

        if (mediaToDelete.length > 0) {
            const publicIdsToDelete = mediaToDelete.map(item => item.public_id).filter(id => id);
            if (publicIdsToDelete.length > 0) {
                await cloudinary.api.delete_resources(publicIdsToDelete);
            }
        }
        
        let finalMedia = originalPost.media.filter(item => urlsToKeep.includes(item.url));

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                uploadToCloudinary(file.buffer, file.mimetype.startsWith('video') ? 'video' : 'auto')
            );
            const newUploadResults = await Promise.all(uploadPromises);
            const newMedia = newUploadResults.map(result => ({
                url: result.secure_url,
                public_id: result.public_id,
                fileType: result.resource_type,
            }));
            finalMedia.push(...newMedia);
        }
        
        // Step 3: Prepare a single update object for the atomic operation
        const updateData = {
            title: title || originalPost.title,
            content: content || originalPost.content,
            tags: tags !== undefined ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : originalPost.tags,
            media: finalMedia,
            coverImage: finalMedia.length > 0 ? finalMedia[0].url : '',
        };

        // Step 4: Perform the atomic update using findByIdAndUpdate
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { new: true, runValidators: true } // {new: true} returns the updated document
        );

        if (!updatedPost) {
             return next(new Error('Could not update the post. It may have been deleted.'));
        }

        res.json(updatedPost);

    } catch (error) {
        // This will now catch any errors from Cloudinary or the database
        console.error("Error updating post:", error);
        next(error);
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Author only)
// --- UPDATED TO DELETE MEDIA FROM CLOUDINARY ---
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized' });
        }

        // Delete associated media from Cloudinary
        if (post.media && post.media.length > 0) {
            const publicIdsToDelete = post.media.map(item => item.public_id).filter(id => id);
            
            if (publicIdsToDelete.length > 0) {
              // This API call can delete multiple resources at once
              await cloudinary.api.delete_resources(publicIdsToDelete, (error, result) => {
                if (error) console.error("Error deleting from Cloudinary:", error);
                console.log("Cloudinary deletion result:", result);
              });
            }
        }

        await post.deleteOne();
        res.json({ message: 'Post and associated media removed' });

    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- NO CHANGES NEEDED FOR THE FUNCTIONS BELOW ---

// @desc    Get all posts with filtering, sorting, and pagination
export const getAllPosts = async (req, res) => {
    // This function works as is.
    const { page = 1, limit = 10, sort = '-createdAt', tag, author } = req.query;
    try {
        const query = {};
        if (tag) { query.tags = tag; }
        if (author) {
            const user = await User.findOne({ username: author });
            if (user) { query.authorId = user._id; } 
            else { return res.json({ posts: [], page, pages: 0, total: 0 }); }
        }
        const posts = await Post.find(query)
            .populate('authorId', 'username profilePicture')
            .limit(limit * 1).skip((page - 1) * limit).sort(sort);
        const count = await Post.countDocuments(query);
        res.json({ posts, page: parseInt(page), pages: Math.ceil(count / limit), total: count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single post by ID
export const getPostById = async (req, res) => {
    // This function works as is.
    try {
        const post = await Post.findById(req.params.id).populate('authorId', 'username profilePicture');
        if (post) { res.json(post); } 
        else { res.status(404).json({ message: 'Post not found' }); }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Like/Unlike a post
export const toggleLikePost = async (req, res) => {
    // This function works as is.
    try {
        const post = await Post.findById(req.params.id);
        if (!post) { return res.status(404).json({ message: 'Post not found' }); }
        const alreadyLiked = post.likes.some(like => like.equals(req.user._id));
        if (alreadyLiked) {
            post.likes = post.likes.filter(like => !like.equals(req.user._id));
        } else {
            post.likes.push(req.user._id);
        }
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Search posts by keyword
// ... other functions

// @desc    Search posts by keyword with sorting
// @route   GET /api/posts/search
// @access  Public
// ...
export const searchPosts = async (req, res, next) => {
    try {
        const keyword = req.query.q || '';
        const sortBy = req.query.sort || 'relevance';
        const limit = parseInt(req.query.limit) || 20;

        if (!keyword.trim()) {
            return res.json([]);
        }

        // --- NEW, MORE ROBUST SEARCH LOGIC ---

        // 1. Find posts matching the text content
        const textMatchQuery = { $text: { $search: keyword } };
        const postsFromText = await Post.find(textMatchQuery);

        // 2. Find authors whose username matches the keyword
        const authorMatchQuery = { username: { $regex: keyword, $options: 'i' } };
        const matchingAuthors = await User.find(authorMatchQuery).select('_id');
        const authorIds = matchingAuthors.map(user => user._id);

        // 3. Find all posts from those authors
        let postsFromAuthors = [];
        if (authorIds.length > 0) {
            postsFromAuthors = await Post.find({ authorId: { $in: authorIds } });
        }

        // 4. Combine the results and remove duplicates
        const combinedResults = new Map();
        // Add text results first to preserve relevance score if needed
        postsFromText.forEach(post => combinedResults.set(post._id.toString(), post));
        postsFromAuthors.forEach(post => combinedResults.set(post._id.toString(), post));
        
        let allPosts = Array.from(combinedResults.values());

        // 5. Populate author details for all posts
        // We do this after combining to be more efficient
        allPosts = await Post.populate(allPosts, { path: 'authorId', select: 'username profilePicture' });

        // 6. Sort the final combined array
        allPosts.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortBy === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            if (sortBy === 'likes') {
                return (b.likesCount || 0) - (a.likesCount || 0);
            }
            // Default 'relevance' - posts from text search are already somewhat relevant.
            // This is a simple fallback. A true relevance score would be more complex.
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // 7. Limit the final results
        const finalPosts = allPosts.slice(0, limit);

        res.json(finalPosts);

    } catch (error) {
        next(error);
    }
};