import { v2 as cloudinary } from 'cloudinary';
import cacheService from '../services/cacheService.js';
import { getDbProvider } from '../config/db.js';
import { getSupabaseClient } from '../config/supabase.js';
import { emitEvent } from '../services/kafkaService.js';

const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'blogsy-media';
let storageBucketReady = false;

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

const hasCloudinaryConfig = () => Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const sanitizeFileName = (name = 'file') =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const inferResourceType = (mimeType = '') => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'image';
};

const getSupabasePublicUrl = (objectPath) => {
    const baseUrl = process.env.SUPABASE_URL;
    return `${baseUrl}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${objectPath}`;
};

const ensureSupabaseStorageBucket = async () => {
    if (storageBucketReady) return;

    const supabase = getSupabaseClient();
    const { data: bucket, error: getError } = await supabase.storage.getBucket(SUPABASE_STORAGE_BUCKET);

    if (getError && !String(getError.message || '').toLowerCase().includes('not found')) {
        throw getError;
    }

    if (!bucket) {
        const { error: createError } = await supabase.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
            public: true,
        });

        if (createError) {
            throw createError;
        }
    } else if (bucket.public !== true) {
        const { error: updateError } = await supabase.storage.updateBucket(SUPABASE_STORAGE_BUCKET, {
            public: true,
        });

        if (updateError) {
            throw updateError;
        }
    }

    storageBucketReady = true;
};

const uploadToSupabaseStorage = async (file, userId = 'anonymous') => {
    await ensureSupabaseStorageBucket();

    const supabase = getSupabaseClient();
    const safeName = sanitizeFileName(file.originalname || 'file');
    const objectPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const { error } = await supabase
        .storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(objectPath, file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            upsert: false,
        });

    if (error) {
        throw error;
    }

    return {
        secure_url: getSupabasePublicUrl(objectPath),
        public_id: null,
        resource_type: inferResourceType(file.mimetype),
        storage_provider: 'supabase',
        storage_path: objectPath,
    };
};

const uploadMediaFile = async (file, userId) => {
    if (hasCloudinaryConfig()) {
        return uploadToCloudinary(file.buffer, file.mimetype.startsWith('video') ? 'video' : 'auto');
    }

    return uploadToSupabaseStorage(file, userId);
};

const mapAuthorToLegacy = (author) => {
    if (!author) return null;

    return {
        _id: author.id,
        username: author.username,
        profilePicture: author.profile_picture || ''
    };
};

const mapPostRowToLegacy = (row, likesByPostId = new Map()) => {
    const likes = likesByPostId.get(row.id) || [];

    return {
        _id: row.id,
        title: row.title,
        content: row.content,
        authorId: mapAuthorToLegacy(row.users) || row.author_id,
        tags: row.tags || [],
        likes,
        likesCount: row.likes_count ?? likes.length,
        coverImage: row.cover_image || '',
        media: Array.isArray(row.media) ? row.media : [],
        status: row.status || 'published',
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

const getSortConfig = (sort = '-createdAt') => {
    const normalized = String(sort || '-createdAt');
    const descending = normalized.startsWith('-');
    const field = descending ? normalized.slice(1) : normalized;

    const fieldMap = {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        likesCount: 'likes_count',
        title: 'title'
    };

    return {
        column: fieldMap[field] || 'created_at',
        ascending: !descending
    };
};

const fetchLikesMapForPosts = async (supabase, postIds) => {
    const likesByPostId = new Map();

    if (!postIds.length) {
        return likesByPostId;
    }

    const { data: likeRows, error } = await supabase
        .from('post_likes')
        .select('post_id,user_id')
        .in('post_id', postIds);

    if (error) {
        throw error;
    }

    likeRows.forEach((row) => {
        if (!likesByPostId.has(row.post_id)) {
            likesByPostId.set(row.post_id, []);
        }

        likesByPostId.get(row.post_id).push(row.user_id);
    });

    return likesByPostId;
};

const postSelectWithAuthor = `
    id,
    title,
    content,
    author_id,
    tags,
    cover_image,
    media,
    status,
    likes_count,
    created_at,
    updated_at,
    users!posts_author_id_fkey(id, username, profile_picture)
`;

const getSupabasePostById = async (supabase, postId) => {
    const { data: row, error } = await supabase
        .from('posts')
        .select(postSelectWithAuthor)
        .eq('id', postId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return row;
};

const normalizeTags = (tags) => {
    if (Array.isArray(tags)) {
        return tags.map((tag) => String(tag).trim()).filter(Boolean);
    }

    if (typeof tags === 'string') {
        return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }

    return [];
};

const parseMediaUrlsField = (mediaUrlsField) => {
    if (!mediaUrlsField) return [];

    try {
        const parsed = typeof mediaUrlsField === 'string'
            ? JSON.parse(mediaUrlsField)
            : mediaUrlsField;

        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((item) => ({
                url: item?.url || '',
                public_id: item?.public_id || null,
                fileType: item?.fileType || item?.type || 'image',
                storage_provider: item?.storage_provider || null,
                storage_path: item?.storage_path || null,
                name: item?.name || null,
            }))
            .filter((item) => Boolean(item.url));
    } catch (error) {
        return [];
    }
};

const ensureSupabaseRequest = (res) => {
    if (getDbProvider() !== 'supabase') {
        res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
        return false;
    }

    return true;
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
    const { title, content, tags, status = 'published', mediaUrls } = req.body;
    if (!title || !content) {
        const error = new Error('Title and content are required');
        error.status = 400;
        return next(error);
    }

    try {
        if (!ensureSupabaseRequest(res)) return;

        let media = [];
        let coverImage = '';

        const preUploadedMedia = parseMediaUrlsField(mediaUrls);

        if (preUploadedMedia.length > 0) {
            media = preUploadedMedia;
            coverImage = preUploadedMedia[0].url;
        }

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => uploadMediaFile(file, req.user._id));
            const uploadResults = await Promise.all(uploadPromises);

            media = uploadResults.map(result => ({
                url: result.secure_url,
                public_id: result.public_id,
                fileType: result.resource_type,
                storage_provider: result.storage_provider || null,
                storage_path: result.storage_path || null,
            }));

            if (media.length > 0) {
                coverImage = media[0].url;
            }
        }

        let createdPost;

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const safeStatus = ['draft', 'published'].includes(status) ? status : 'published';
            const parsedTags = normalizeTags(tags);

            const { data: row, error } = await supabase
                .from('posts')
                .insert({
                    title,
                    content,
                    tags: parsedTags,
                    author_id: req.user._id,
                    cover_image: coverImage,
                    media,
                    status: safeStatus,
                    likes_count: 0,
                })
                .select(postSelectWithAuthor)
                .single();

            if (error) {
                throw error;
            }

            createdPost = mapPostRowToLegacy(row, new Map([[row.id, []]]));
        } else {
            const newPost = new Post({
                title, content,
                tags: tags ? tags.split(',').filter(tag => tag.trim() !== '') : [],
                authorId: req.user._id,
                coverImage,
                media,
                status,
            });

            createdPost = await newPost.save();
        }

        // --- Cache Invalidation ---
        // Clear post lists cache when new post is created
        await cacheService.clear('posts:list:*');
        // Clear user profile cache for the author
        await cacheService.del(`users:profile:${req.user.username}`);
        console.log('Cache cleared for new post creation');
        // -------------------------

        await emitEvent('post.created', {
            postId: createdPost._id,
            authorId: createdPost.authorId?._id || createdPost.authorId,
            title: createdPost.title,
            status: createdPost.status || 'published',
        });

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
        if (!ensureSupabaseRequest(res)) return;

        const { title, content, tags, status, existingMediaUrls, mediaUrls } = req.body;

        let originalPost;
        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const originalRow = await getSupabasePostById(supabase, req.params.id);

            if (!originalRow) {
                const error = new Error('Post not found');
                error.status = 404;
                return next(error);
            }

            if (String(originalRow.author_id) !== String(req.user._id)) {
                const error = new Error('User not authorized');
                error.status = 403;
                return next(error);
            }

            originalPost = {
                _id: originalRow.id,
                title: originalRow.title,
                content: originalRow.content,
                authorId: originalRow.author_id,
                tags: originalRow.tags || [],
                status: originalRow.status,
                media: Array.isArray(originalRow.media) ? originalRow.media : [],
            };
        } else {
            originalPost = await Post.findById(req.params.id);
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
        }

        // Step 2: Handle Cloudinary media operations (deletions and uploads)
        const urlsToKeep = existingMediaUrls
            ? (Array.isArray(existingMediaUrls) ? existingMediaUrls : JSON.parse(existingMediaUrls))
            : [];
        const mediaToDelete = originalPost.media.filter(item => !urlsToKeep.includes(item.url));

        if (mediaToDelete.length > 0) {
            const publicIdsToDelete = mediaToDelete.map(item => item.public_id).filter(id => id);
            if (publicIdsToDelete.length > 0) {
                await cloudinary.api.delete_resources(publicIdsToDelete);
            }

            const supabasePathsToDelete = mediaToDelete
                .filter((item) => item?.storage_provider === 'supabase' && item?.storage_path)
                .map((item) => item.storage_path);

            if (supabasePathsToDelete.length > 0) {
                const supabase = getSupabaseClient();
                await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove(supabasePathsToDelete);
            }
        }

        let finalMedia = originalPost.media.filter(item => urlsToKeep.includes(item.url));

        const preUploadedMedia = parseMediaUrlsField(mediaUrls);
        if (preUploadedMedia.length > 0) {
            finalMedia.push(...preUploadedMedia);
        }

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => uploadMediaFile(file, req.user._id));
            const newUploadResults = await Promise.all(uploadPromises);
            const newMedia = newUploadResults.map(result => ({
                url: result.secure_url,
                public_id: result.public_id,
                fileType: result.resource_type,
                storage_provider: result.storage_provider || null,
                storage_path: result.storage_path || null,
            }));
            finalMedia.push(...newMedia);
        }

        // Step 3: Prepare a single update object for the atomic operation
        const updateData = {
            title: title || originalPost.title,
            content: content || originalPost.content,
            tags: tags !== undefined ? normalizeTags(tags) : originalPost.tags,
            status: status || originalPost.status,
            media: finalMedia,
            coverImage: finalMedia.length > 0 ? finalMedia[0].url : '',
        };

        let updatedPost;
        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const safeStatus = ['draft', 'published'].includes(updateData.status) ? updateData.status : 'published';

            const { data: updatedRow, error: updateError } = await supabase
                .from('posts')
                .update({
                    title: updateData.title,
                    content: updateData.content,
                    tags: updateData.tags,
                    status: safeStatus,
                    media: updateData.media,
                    cover_image: updateData.coverImage,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', req.params.id)
                .select(postSelectWithAuthor)
                .maybeSingle();

            if (updateError) {
                throw updateError;
            }

            if (!updatedRow) {
                const error = new Error('Could not update the post. It may have been deleted.');
                error.status = 404;
                return next(error);
            }

            const likesByPostId = await fetchLikesMapForPosts(supabase, [updatedRow.id]);
            updatedPost = mapPostRowToLegacy(updatedRow, likesByPostId);
        } else {
            updatedPost = await Post.findByIdAndUpdate(
                req.params.id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        }

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
        if (!ensureSupabaseRequest(res)) return;

        let post;
        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            post = await getSupabasePostById(supabase, req.params.id);
        } else {
            post = await Post.findById(req.params.id);
        }

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const postAuthorId = getDbProvider() === 'supabase' ? post.author_id : post.authorId;
        if (String(postAuthorId) !== String(req.user._id)) {
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

            const supabasePathsToDelete = post.media
                .filter((item) => item?.storage_provider === 'supabase' && item?.storage_path)
                .map((item) => item.storage_path);

            if (supabasePathsToDelete.length > 0) {
                const supabase = getSupabaseClient();
                await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove(supabasePathsToDelete);
            }
        }

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const { error: deleteError } = await supabase
                .from('posts')
                .delete()
                .eq('id', req.params.id);

            if (deleteError) {
                throw deleteError;
            }
        } else {
            await post.deleteOne();
        }

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

export const getAllPosts = async (req, res) => {
    const { page = 1, limit = 10, sort = '-createdAt', tag, author, status = 'published' } = req.query;

    const cacheKey = `posts:list:page:${page}:limit:${limit}:sort:${sort}:tag:${tag || ''}:author:${author || ''}:status:${status}`;

    try {
        if (!ensureSupabaseRequest(res)) return;

        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.log('Cache hit:', cacheKey);
            return res.json(cached); // ✔ FIXED
        }

        console.log('Cache miss:', cacheKey);

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const numericPage = Number(page);
            const numericLimit = Number(limit);
            const from = (numericPage - 1) * numericLimit;
            const to = from + numericLimit - 1;

            let authorIdFilter = null;
            if (author) {
                const { data: authorRow, error: authorError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', author)
                    .maybeSingle();

                if (authorError) {
                    throw authorError;
                }

                if (!authorRow) {
                    const emptyResponse = { posts: [], page: numericPage, pages: 0, total: 0 };
                    await cacheService.set(cacheKey, emptyResponse, 300);
                    return res.json(emptyResponse);
                }

                authorIdFilter = authorRow.id;
            }

            const { column, ascending } = getSortConfig(sort);

            let query = supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    content,
                    author_id,
                    tags,
                    cover_image,
                    media,
                    status,
                    likes_count,
                    created_at,
                    updated_at,
                    users!posts_author_id_fkey(id, username, profile_picture)
                `, { count: 'exact' })
                .order(column, { ascending })
                .range(from, to);

            if (status) {
                query = query.eq('status', status);
            }

            if (tag) {
                query = query.contains('tags', [tag]);
            }

            if (authorIdFilter) {
                query = query.eq('author_id', authorIdFilter);
            }

            const { data: postRows, error: postsError, count } = await query;

            if (postsError) {
                throw postsError;
            }

            const likesByPostId = await fetchLikesMapForPosts(supabase, postRows.map((row) => row.id));
            const posts = postRows.map((row) => mapPostRowToLegacy(row, likesByPostId));

            const response = {
                posts,
                page: numericPage,
                pages: Math.ceil((count || 0) / numericLimit),
                total: count || 0
            };

            await cacheService.set(cacheKey, response, 300);
            return res.json(response);
        }

        const query = {};

        if (status === 'published') {
            query.$or = [
                { status: 'published' },
                { status: { $exists: false } }
            ];
        } else {
            query.status = status;
        }

        if (tag) {
            if (query.$or) {
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

        const posts = await Post.find(query)
            .populate('authorId', 'username profilePicture')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sort);

        const count = await Post.countDocuments(query);

        const response = {
            posts,
            page: Number(page),
            pages: Math.ceil(count / limit),
            total: count
        };

        await cacheService.set(cacheKey, response, 300); // ✔ FIXED

        res.json(response);

    } catch (error) {
        console.error('Error in getAllPosts:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const getPostById = async (req, res) => {
    const { id } = req.params;
    const cacheKey = `posts:detail:${id}`;

    try {
        if (!ensureSupabaseRequest(res)) return;

        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.log('Cache hit:', cacheKey);
            return res.json(cached); // ✔ FIXED
        }

        console.log('Cache miss:', cacheKey);

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();

            const { data: row, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    content,
                    author_id,
                    tags,
                    cover_image,
                    media,
                    status,
                    likes_count,
                    created_at,
                    updated_at,
                    users!posts_author_id_fkey(id, username, profile_picture)
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!row) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const likesByPostId = await fetchLikesMapForPosts(supabase, [row.id]);
            const post = mapPostRowToLegacy(row, likesByPostId);

            await cacheService.set(cacheKey, post, 600);
            return res.json(post);
        }

        const post = await Post.findById(id).populate('authorId', 'username profilePicture');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await cacheService.set(cacheKey, post, 600); // ✔ FIXED

        res.json(post);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
// @desc    Like/Unlike a post
export const toggleLikePost = async (req, res) => {
    try {
        if (!ensureSupabaseRequest(res)) return;

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const postId = req.params.id;
            const userId = req.user._id;

            const postRow = await getSupabasePostById(supabase, postId);
            if (!postRow) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const { data: existingLike, error: likeLookupError } = await supabase
                .from('post_likes')
                .select('post_id,user_id')
                .eq('post_id', postId)
                .eq('user_id', userId)
                .maybeSingle();

            if (likeLookupError) {
                throw likeLookupError;
            }

            if (existingLike) {
                const { error: deleteLikeError } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId);

                if (deleteLikeError) {
                    throw deleteLikeError;
                }
            } else {
                const { error: insertLikeError } = await supabase
                    .from('post_likes')
                    .insert({ post_id: postId, user_id: userId });

                if (insertLikeError) {
                    throw insertLikeError;
                }
            }

            const { count, error: countError } = await supabase
                .from('post_likes')
                .select('post_id', { count: 'exact', head: true })
                .eq('post_id', postId);

            if (countError) {
                throw countError;
            }

            const { error: updateCountError } = await supabase
                .from('posts')
                .update({ likes_count: count || 0, updated_at: new Date().toISOString() })
                .eq('id', postId);

            if (updateCountError) {
                throw updateCountError;
            }

            const updatedRow = await getSupabasePostById(supabase, postId);
            const likesByPostId = await fetchLikesMapForPosts(supabase, [postId]);
            const updatedPost = mapPostRowToLegacy(updatedRow, likesByPostId);

            await cacheService.del(`posts:detail:${postId}`);
            await cacheService.clear('posts:list:*');

            return res.json(updatedPost);
        }

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
        if (!ensureSupabaseRequest(res)) return;

        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.log('Cache hit for drafts:', cacheKey);
            return res.json(cached); // ✔ FIXED
        }

        console.log('Cache miss for drafts:', cacheKey);

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const numericPage = Number(page);
            const numericLimit = Number(limit);
            const from = (numericPage - 1) * numericLimit;
            const to = from + numericLimit - 1;

            const { data: rows, error, count } = await supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    content,
                    author_id,
                    tags,
                    cover_image,
                    media,
                    status,
                    likes_count,
                    created_at,
                    updated_at,
                    users!posts_author_id_fkey(id, username, profile_picture)
                `, { count: 'exact' })
                .eq('author_id', req.user._id)
                .eq('status', 'draft')
                .order('updated_at', { ascending: false })
                .range(from, to);

            if (error) {
                throw error;
            }

            const likesByPostId = await fetchLikesMapForPosts(supabase, rows.map((row) => row.id));
            const drafts = rows.map((row) => mapPostRowToLegacy(row, likesByPostId));

            const total = count || 0;
            const result = {
                posts: drafts,
                pagination: {
                    currentPage: numericPage,
                    totalPages: Math.ceil(total / numericLimit),
                    totalPosts: total,
                    hasNextPage: numericPage * numericLimit < total,
                    hasPrevPage: numericPage > 1
                }
            };

            await cacheService.set(cacheKey, result, 300);
            return res.json(result);
        }

        const skip = (page - 1) * limit;

        const drafts = await Post.find({
            authorId: req.user._id,
            status: 'draft'
        })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('authorId', 'username profilePicture');

        const total = await Post.countDocuments({
            authorId: req.user._id,
            status: 'draft'
        });

        const result = {
            posts: drafts,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };

        await cacheService.set(cacheKey, result, 300); // ✔ FIXED

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
        if (!ensureSupabaseRequest(res)) return;

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const row = await getSupabasePostById(supabase, req.params.id);

            if (!row) {
                return res.status(404).json({ message: 'Post not found' });
            }

            if (String(row.author_id) !== String(req.user._id)) {
                return res.status(403).json({ message: 'User not authorized' });
            }

            if (row.status !== 'draft') {
                return res.status(400).json({ message: 'Post is not a draft' });
            }

            const { data: updatedRow, error: updateError } = await supabase
                .from('posts')
                .update({ status: 'published', updated_at: new Date().toISOString() })
                .eq('id', req.params.id)
                .select(postSelectWithAuthor)
                .single();

            if (updateError) {
                throw updateError;
            }

            const likesByPostId = await fetchLikesMapForPosts(supabase, [updatedRow.id]);
            const post = mapPostRowToLegacy(updatedRow, likesByPostId);

            await cacheService.del(`posts:detail:${req.params.id}`);
            await cacheService.clear('posts:list:*');
            await cacheService.clear(`posts:drafts:${req.user._id}:*`);
            await cacheService.del(`users:profile:${req.user.username}`);
            console.log('Cache cleared for draft publication');

            return res.json(post);
        }

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
        if (!ensureSupabaseRequest(res)) return;

        const keyword = req.query.q || '';
        const sortBy = req.query.sort || 'relevance';
        const limit = parseInt(req.query.limit) || 20;

        if (!keyword.trim()) {
            return res.json([]);
        }

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();

            const { data: textRows, error: textError } = await supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    content,
                    author_id,
                    tags,
                    cover_image,
                    media,
                    status,
                    likes_count,
                    created_at,
                    updated_at,
                    users!posts_author_id_fkey(id, username, profile_picture)
                `)
                .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
                .eq('status', 'published')
                .limit(limit);

            if (textError) {
                throw textError;
            }

            const { data: matchingAuthors, error: authorError } = await supabase
                .from('users')
                .select('id')
                .ilike('username', `%${keyword}%`)
                .limit(50);

            if (authorError) {
                throw authorError;
            }

            let authorRows = [];
            if (matchingAuthors.length > 0) {
                const authorIds = matchingAuthors.map((user) => user.id);
                const { data: rows, error: postsByAuthorError } = await supabase
                    .from('posts')
                    .select(`
                        id,
                        title,
                        content,
                        author_id,
                        tags,
                        cover_image,
                        media,
                        status,
                        likes_count,
                        created_at,
                        updated_at,
                        users!posts_author_id_fkey(id, username, profile_picture)
                    `)
                    .in('author_id', authorIds)
                    .eq('status', 'published')
                    .limit(limit);

                if (postsByAuthorError) {
                    throw postsByAuthorError;
                }

                authorRows = rows;
            }

            const combined = new Map();
            textRows.forEach((row) => combined.set(row.id, row));
            authorRows.forEach((row) => combined.set(row.id, row));

            let allRows = Array.from(combined.values());

            allRows.sort((a, b) => {
                if (sortBy === 'newest') {
                    return new Date(b.created_at) - new Date(a.created_at);
                }
                if (sortBy === 'oldest') {
                    return new Date(a.created_at) - new Date(b.created_at);
                }
                if (sortBy === 'likes') {
                    return (b.likes_count || 0) - (a.likes_count || 0);
                }
                return new Date(b.created_at) - new Date(a.created_at);
            });

            allRows = allRows.slice(0, limit);

            const likesByPostId = await fetchLikesMapForPosts(supabase, allRows.map((row) => row.id));
            const finalPosts = allRows.map((row) => mapPostRowToLegacy(row, likesByPostId));

            return res.json(finalPosts);
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
