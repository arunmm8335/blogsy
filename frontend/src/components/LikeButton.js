// In /src/components/LikeButton.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaRegHeart } from 'react-icons/fa'; // Import icons
import './LikeButton.css';

// We'll pass the post and a function to update the post in the parent component's state
const LikeButton = ({ post, onLikeToggle }) => {
  const { user } = useAuth();

  if (!user) {
    // Optionally, show a disabled button or hide it if user is not logged in
    return (
      <div className="like-container">
        <span className="like-icon disabled">❤</span>
        <span className="like-count">{post.likes.length}</span>
      </div>
    );
  }

 const isLiked = user && post.likes.includes(user._id);

  const handleLikeClick = (e) => {
    e.preventDefault(); // Prevent navigation if the button is inside a Link
    onLikeToggle(post._id);
  };

   return (
    <button onClick={handleLikeClick} className={`like-button ${isLiked ? 'liked' : ''}`}>
      {/* Use icons instead of text */}
      {isLiked ? <FaHeart /> : <FaRegHeart />}
      <span className="like-count">{post.likes.length}</span>
    </button>
  );
};

export default LikeButton;