import Post from '../models/Post.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';
import cacheService from '../services/cacheService.js';

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
    const { title, content, tags, status = 'published' } = req.body;
    if (!title || !content) {
        const error = new Error('Title and content are required');
        error.status = 400;
        return next(error);
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
            authorId: req.user._id,
            coverImage, // Set the cover image
            media,      // Set the full media array
            status,     // Set the status (draft or published)
        });

        const createdPost = await newPost.save();

        // --- Cache Invalidation ---
        // Clear post lists cache when new post is created
        await cacheService.clear('posts:list:*');
        // Clear user profile cache for the author
        await cacheService.del(`users:profile:${req.user.username}`);
        console.log('Cache cleared for new post creation');
        // -------------------------

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
            const error = new Error('Post not found');
            error.status = 404;
            return next(error);
        }
        if (originalPost.authorId.toString() !== req.user._id.toString()) {
            const error = new Error('User not authorized');
            error.status = 403;
            return next(error);
        }

        const { title, content, tags, status, existingMediaUrls } = req.body;

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
            status: status || originalPost.status,
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
            const error = new Error('Could not update the post. It may have been deleted.');
            error.status = 404;
            return next(error);
        }

        res.json(updatedPost);

        // --- Cache Invalidation ---
        // Clear specific post cache
        await cacheService.del(`posts:detail:${req.params.id}`);
        // Clear post lists cache
        await cacheService.clear('posts:list:*');
        // Clear drafts cache for the author
        await cacheService.clear(`posts:drafts:${req.user._id}:*`);
        // Clear user profile cache for the author
        await cacheService.del(`users:profile:${req.user.username}`);
        console.log('Cache cleared for post update');
        // -------------------------

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

        // --- Cache Invalidation ---
        // Clear specific post cache
        await cacheService.del(`posts:detail:${req.params.id}`);
        // Clear post lists cache
        await cacheService.clear('posts:list:*');
        // Clear user profile cache for the author
        await cacheService.del(`users:profile:${req.user.username}`);
        // Clear comments cache for this post
        await cacheService.del(`comments:post:${req.params.id}`);
        console.log('Cache cleared for post deletion');
        // -------------------------

        res.json({ message: 'Post and associated media removed' });

    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- NO CHANGES NEEDED FOR THE FUNCTIONS BELOW ---

// @desc    Get all posts with filtering, sorting, and pagination
export const getAllPosts = async (req, res) => {
    const { page = 1, limit = 10, sort = '-createdAt', tag, author, status = 'published' } = req.query;
    // --- Redis cache key ---
    const cacheKey = `posts:list:page:${page}:limit:${limit}:sort:${sort}:tag:${tag || ''}:author:${author || ''}:status:${status}`;
    try {
        // 1. Try cache first
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.log('Cache hit:', cacheKey);
            return res.json(JSON.parse(cached));
        }
        console.log('Cache miss:', cacheKey);

        console.log('Getting posts with query:', { page, limit, sort, tag, author, status });

        const query = {}; // Start with empty query

        // Handle status filtering - include posts with specified status OR posts without status field (legacy posts)
        if (status === 'published') {
            query.$or = [
                { status: 'published' },
                { status: { $exists: false } } // Include legacy posts that don't have status field
            ];
        } else {
            query.status = status; // For drafts, only show posts with status: 'draft'
        }

        // Apply additional filters
        if (tag) {
            if (query.$or) {
                // If we have $or, we need to apply tag filter to both conditions
                query.$and = [
                    { $or: query.$or },
                    { tags: tag }
                ];
                delete query.$or;
            } else {
                query.tags = tag;
            }
        }

        if (author) {
            const user = await User.findOne({ username: author });
            if (user) {
                if (query.$or || query.$and) {
                    // If we have complex query, add authorId to $and
                    if (!query.$and) query.$and = [];
                    if (query.$or) {
                        query.$and.push({ $or: query.$or });
                        delete query.$or;
                    }
                    query.$and.push({ authorId: user._id });
                } else {
                    query.authorId = user._id;
                }
            } else {
                return res.json({ posts: [], page, pages: 0, total: 0 });
            }
        }

        console.log('Final query:', query);

        const posts = await Post.find(query)
            .populate('authorId', 'username profilePicture')
            .limit(limit * 1).skip((page - 1) * limit).sort(sort);

        console.log(`Found ${posts.length} posts`);

        // Use the same query logic for counting
        const countQuery = {};
        if (status === 'published') {
            countQuery.$or = [
                { status: 'published' },
                { status: { $exists: false } }
            ];
        } else {
            countQuery.status = status;
        }

        // Apply additional filters to count query
        if (tag) {
            if (countQuery.$or) {
                countQuery.$and = [
                    { $or: countQuery.$or },
                    { tags: tag }
                ];
                delete countQuery.$or;
            } else {
                countQuery.tags = tag;
            }
        }

        if (author) {
            const user = await User.findOne({ username: author });
            if (user) {
                if (countQuery.$or || countQuery.$and) {
                    if (!countQuery.$and) countQuery.$and = [];
                    if (countQuery.$or) {
                        countQuery.$and.push({ $or: countQuery.$or });
                        delete countQuery.$or;
                    }
                    countQuery.$and.push({ authorId: user._id });
                } else {
                    countQuery.authorId = user._id;
                }
            }
        }

        const count = await Post.countDocuments(countQuery);
        console.log(`Total count: ${count}`);

        const response = { posts, page: parseInt(page), pages: Math.ceil(count / limit), total: count };
        // 2. Store in cache for 5 minutes
        await cacheService.set(cacheKey, JSON.stringify(response), 300);
        res.json(response);
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single post by ID
export const getPostById = async (req, res) => {
    const { id } = req.params;
    const cacheKey = `posts:detail:${id}`;

    try {
        // 1. Try cache first
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.log('Cache hit:', cacheKey);
            return res.json(JSON.parse(cached));
        }
        console.log('Cache miss:', cacheKey);

        console.log('Looking for post with ID:', req.params.id);
        const post = await Post.findById(req.params.id).populate('authorId', 'username profilePicture');
        console.log('Found post:', post ? 'Yes' : 'No');
        if (post) {
            console.log('Post details:', {
                id: post._id,
                title: post.title,
                status: post.status,
                authorId: post.authorId
            });
            // 2. Store in cache for 10 minutes
            await cacheService.set(cacheKey, JSON.stringify(post), 600);
            res.json(post);
        } else {
            console.log('Post not found with ID:', req.params.id);
            res.status(404).json({ message: 'Post not found' });
        }
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

// @desc    Get user drafts
// @route   GET /api/posts/drafts
// @access  Private
export const getUserDrafts = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const cacheKey = `posts:drafts:${req.user._id}:page:${page}:limit:${limit}`;

    try {
        // Try cache first
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.log('Cache hit for drafts:', cacheKey);
            return res.json(JSON.parse(cached));
        }
        console.log('Cache miss for drafts:', cacheKey);

        const skip = (page - 1) * limit;

        const drafts = await Post.find({
            authorId: req.user._id,
            status: 'draft'
        })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('authorId', 'username profilePicture');

        const total = await Post.countDocuments({
            authorId: req.user._id,
            status: 'draft'
        });

        const result = {
            posts: drafts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };

        // Cache drafts for 5 minutes
        await cacheService.set(cacheKey, JSON.stringify(result), 300);

        res.json(result);
    } catch (error) {
        console.error("Error fetching drafts:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Publish a draft
// @route   PUT /api/posts/:id/publish
// @access  Private (Author only)
export const publishDraft = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized' });
        }

        if (post.status !== 'draft') {
            return res.status(400).json({ message: 'Post is not a draft' });
        }

        post.status = 'published';
        await post.save();

        // --- Cache Invalidation ---
        await cacheService.del(`posts:detail:${req.params.id}`);
        await cacheService.clear('posts:list:*');
        await cacheService.clear(`posts:drafts:${req.user._id}:*`);
        await cacheService.del(`users:profile:${req.user.username}`);
        console.log('Cache cleared for draft publication');
        // -------------------------

        res.json(post);
    } catch (error) {
        console.error("Error publishing draft:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

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