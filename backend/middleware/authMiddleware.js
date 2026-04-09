// In middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { getDbProvider } from '../config/db.js';
import { getSupabaseClient } from '../config/supabase.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if the token is in the header and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer eyJhbGci...")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (getDbProvider() !== 'supabase') {
        return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
      }

      const supabase = getSupabaseClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, bio, profile_picture, dob, mobile, social_links, created_at, updated_at')
        .eq('id', decoded.id)
        .maybeSingle();

      if (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      req.user = user
        ? {
          _id: user.id,
          username: user.username,
          email: user.email,
          bio: user.bio,
          profilePicture: user.profile_picture || '',
          dob: user.dob,
          mobile: user.mobile,
          socialLinks: user.social_links || {},
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
        : null;

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Move on to the next middleware or route handler
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
