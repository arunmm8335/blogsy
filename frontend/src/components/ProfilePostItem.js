import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegComment, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toggleLike } from '../services/api';
import toast from 'react-hot-toast';
import MediaPreview from './MediaPreview';
import './ProfilePostItem.css';

const ProfilePostItem = ({ post: initialPost }) => {
    const [post, setPost] = useState(initialPost);
    const { user } = useAuth();

    const handleLikeToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error("You must be logged in to like a post.");
            return;
        }
        try {
            const isCurrentlyLiked = post.likes.includes(user._id);
            setPost(prevPost => ({
                ...prevPost,
                likes: isCurrentlyLiked
                    ? prevPost.likes.filter(id => id !== user._id)
                    : [...prevPost.likes, user._id],
            }));
            await toggleLike(post._id, user.token);
        } catch (error) {
            toast.error("Failed to update like status.");
            setPost(initialPost);
        }
    };

    const isLiked = user && post.likes.includes(user._id);

    return (
        <Link to={`/posts/${post._id}`} className="post-item-card">
            <div className="post-item-image-wrapper">
                <MediaPreview post={post} className="post-item-image" />
            </div>
            <div className="post-item-content">
                <div className="post-tags">
                    {(post.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="post-tag">#{tag}</span>
                    ))}
                </div>
                <div className="post-item-body">
                    <h2 className="post-title">{post.title}</h2>
                    <p className="post-meta">
                        By {post.authorId?.username || 'Unknown'}
                    </p>
                </div>
                <div className="post-stats">
                    <button onClick={handleLikeToggle} className={`like-button ${isLiked ? 'liked' : ''}`}>
                        {isLiked ? <FaHeart color="#e53e3e" size={18} /> : <FaRegHeart size={18} />}
                    </button>
                    <span className="like-count" style={{ fontSize: '0.98rem', marginLeft: 0, marginRight: 0 }}>{post.likes.length}</span>
                    <div className="comment-info">
                        <FaRegComment size={18} />
                        <span style={{ fontSize: '0.98rem', marginLeft: 4 }}>{post.commentCount || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProfilePostItem; 
