import User from '../models/User.js';
import Post from '../models/Post.js';
import { v2 as cloudinary } from 'cloudinary'; // <-- Import Cloudinary
import cacheService from '../services/cacheService.js';

// Configure Cloudinary (make sure your .env file has these variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// This helper function can be shared or defined here.
// It handles the actual upload to your Cloudinary account.
const uploadToCloudinary = (fileBuffer, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ 
            folder: "blogsy_profile_pictures", // Use a dedicated folder for profiles
            resource_type: resourceType
        }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        uploadStream.end(fileBuffer);
    });
};


// @desc    Get public user profile and their posts (This function is correct)
export const getUserProfileByUsername = async (req, res) => {
  const { username } = req.params;
  const cacheKey = `users:profile:${username}`;

  try {
    // 1. Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return res.json(JSON.parse(cached));
    }
    console.log('Cache miss:', cacheKey);

    const user = await User.findOne({ username: username }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const posts = await Post.find({ authorId: user._id })
            .populate('authorId', 'username profilePicture')
            .sort({ createdAt: -1 });

    const response = { user, posts };

    // 2. Store in cache for 15 minutes
    await cacheService.set(cacheKey, JSON.stringify(response), 900);

    res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Update current user's profile
// @route   PUT /api/users/me
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.bio = req.body.bio || user.bio;
      user.dob = req.body.dob || user.dob;
      user.mobile = req.body.mobile || user.mobile;
      
      if (req.body.socialLinks) {
        try {
          user.socialLinks = JSON.parse(req.body.socialLinks);
        } catch (e) {
          console.error("Could not parse socialLinks JSON");
        }
      }

      // --- THIS IS THE CLOUDINARY UPLOAD FIX ---
      if (req.file) {
        // We have a new file from multer, upload its buffer to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'image');
        
        // Save the secure URL from Cloudinary to the user document
        user.profilePicture = result.secure_url;
      }
      // ------------------------------------------
      
      const updatedUser = await user.save();

      // Return the full updated user object to the frontend
      res.json({
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          bio: updatedUser.bio,
          profilePicture: updatedUser.profilePicture,
          socialLinks: updatedUser.socialLinks,
          dob: updatedUser.dob,
          mobile: updatedUser.mobile,
      });

      // --- Cache Invalidation ---
      // Clear user profile cache
      await cacheService.del(`users:profile:${updatedUser.username}`);
      console.log('Cache cleared for user profile update');
      // -------------------------

    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    next(error); // Pass error to Express error handler
  }
};