import { v2 as cloudinary } from 'cloudinary';
import cacheService from '../services/cacheService.js';
import { getDbProvider } from '../config/db.js';
import { getSupabaseClient } from '../config/supabase.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploadToCloudinary = (fileBuffer, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'blogsy_profile_pictures',
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

const mapSupabaseUserToLegacy = (row) => ({
  _id: row.id,
  username: row.username,
  email: row.email,
  bio: row.bio || '',
  profilePicture: row.profile_picture || '',
  socialLinks: row.social_links || {},
  dob: row.dob,
  mobile: row.mobile,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSupabasePostToLegacy = (row, likesByPostId = new Map()) => {
  const likes = likesByPostId.get(row.id) || [];

  return {
    _id: row.id,
    title: row.title,
    content: row.content,
    authorId: row.users
      ? {
        _id: row.users.id,
        username: row.users.username,
        profilePicture: row.users.profile_picture || '',
      }
      : row.author_id,
    tags: row.tags || [],
    likes,
    likesCount: row.likes_count ?? likes.length,
    coverImage: row.cover_image || '',
    media: Array.isArray(row.media) ? row.media : [],
    status: row.status || 'published',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const getUserProfileByUsername = async (req, res) => {
  const { username } = req.params;
  const cacheKey = `users:profile:${username}`;

  try {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return res.json(cached);
    }

    console.log('Cache miss:', cacheKey);

    if (getDbProvider() !== 'supabase') {
      return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
    }

    const supabase = getSupabaseClient();

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, username, email, bio, profile_picture, social_links, dob, mobile, created_at, updated_at')
      .eq('username', username)
      .maybeSingle();

    if (userError) throw userError;

    if (!userRow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: postRows, error: postsError } = await supabase
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
      .eq('author_id', userRow.id)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    const postIds = postRows.map((row) => row.id);
    const likesByPostId = new Map();

    if (postIds.length > 0) {
      const { data: likeRows, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id,user_id')
        .in('post_id', postIds);

      if (likesError) throw likesError;

      likeRows.forEach((row) => {
        if (!likesByPostId.has(row.post_id)) {
          likesByPostId.set(row.post_id, []);
        }
        likesByPostId.get(row.post_id).push(row.user_id);
      });
    }

    const response = {
      user: mapSupabaseUserToLegacy(userRow),
      posts: postRows.map((row) => mapSupabasePostToLegacy(row, likesByPostId)),
    };

    await cacheService.set(cacheKey, response, 900);
    return res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    if (getDbProvider() !== 'supabase') {
      return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
    }

    const supabase = getSupabaseClient();

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id, username, email, bio, profile_picture, social_links, dob, mobile, created_at, updated_at')
      .eq('id', req.user._id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let socialLinks = existingUser.social_links || {};
    if (req.body.socialLinks) {
      try {
        socialLinks = JSON.parse(req.body.socialLinks);
      } catch (e) {
        console.error('Could not parse socialLinks JSON');
      }
    }

    let profilePicture = existingUser.profile_picture || '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'image');
      profilePicture = result.secure_url;
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('users')
      .update({
        username: req.body.username || existingUser.username,
        bio: req.body.bio || existingUser.bio || '',
        dob: req.body.dob || existingUser.dob,
        mobile: req.body.mobile || existingUser.mobile,
        social_links: socialLinks,
        profile_picture: profilePicture,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user._id)
      .select('id, username, email, bio, profile_picture, social_links, dob, mobile, created_at, updated_at')
      .single();

    if (updateError) throw updateError;

    const updatedUser = mapSupabaseUserToLegacy(updatedRow);

    res.json(updatedUser);

    await cacheService.del(`users:profile:${req.user.username}`);
    if (req.user.username !== updatedUser.username) {
      await cacheService.del(`users:profile:${updatedUser.username}`);
    }
    console.log('Cache cleared for user profile update');
    return;
  } catch (error) {
    console.error(error);
    next(error);
  }
};
