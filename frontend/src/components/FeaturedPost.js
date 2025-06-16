import React from 'react';
import { Link } from 'react-router-dom';
import MediaPreview from './MediaPreview'; // <-- IMPORT THE NEW COMPONENT
import './FeaturedPost.css';

const FeaturedPost = ({ post }) => {
  if (!post) return null;

  return (
    <Link to={`/posts/${post._id}`} className="featured-post-card">
      {/* --- THE FIX: Use the MediaPreview component --- */}
      <MediaPreview post={post} className="featured-post-image" />
     
      <div className="featured-post-overlay">
        <div className="featured-post-content">
          <span className="featured-post-tag">Featured</span>
          <h1 className="featured-post-title">{post.title}</h1>
          <p className="featured-post-author">By {post.authorId?.username}</p>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedPost;