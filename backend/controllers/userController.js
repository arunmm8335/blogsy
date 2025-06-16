import User from '../models/User.js';
import Post from '../models/Post.js';
import { v2 as cloudinary } from 'cloudinary'; // <-- Import Cloudinary

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
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const posts = await Post.find({ authorId: user._id })
            .populate('authorId', 'username profilePicture')
            .sort({ createdAt: -1 });
        res.json({ user, posts });
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
    const user = await User.findById(req.user.id);

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

    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    next(error); // Pass error to Express error handler
  }
};