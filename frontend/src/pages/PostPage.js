import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async'; // <-- Import Helmet
import { motion, useScroll } from 'framer-motion';
import { fetchPostById, fetchComments, addComment, deletePost, toggleLike, updateComment, deleteComment, likeComment, dislikeComment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LikeButton from '../components/LikeButton';
import PostPageSkeleton from './PostPageSkeleton'; // <-- CORRECTED IMPORT PATH
import Comment from '../components/Comment';
import CommentForm from '../components/CommentForm';
import MediaRenderer from '../components/MediaRenderer'; // Assuming this is in /src/components/
import './PostPage.css';

const buildCommentTree = (comments) => {
    const commentMap = {};
    comments.forEach(comment => {
        commentMap[comment._id] = { ...comment, replies: [] };
    });
    const commentTree = [];
    comments.forEach(comment => {
        if (comment.parentId && commentMap[comment.parentId]) {
            commentMap[comment.parentId].replies.push(commentMap[comment._id]);
        } else {
            commentTree.push(commentMap[comment._id]);
        }
    });
    return commentTree;
};

const sortCommentTree = (nodes, sort = 'recent') => {
    const multiplier = sort === 'oldest' ? 1 : -1;

    const sorted = [...nodes].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return (aTime - bTime) * multiplier;
    });

    return sorted.map((node) => ({
        ...node,
        replies: sortCommentTree(node.replies || [], sort),
    }));
};

const countCommentTree = (nodes) => nodes.reduce(
    (acc, node) => acc + 1 + countCommentTree(node.replies || []),
    0
);

const PostPage = () => {
    const { id } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [readingTime, setReadingTime] = useState(0);
    const [newCommentId, setNewCommentId] = useState(null);
    const [commentSort, setCommentSort] = useState('recent');
    const { scrollYProgress } = useScroll();

    const commentsForRender = useMemo(
        () => sortCommentTree(comments, commentSort),
        [comments, commentSort]
    );

    const commentCount = useMemo(
        () => countCommentTree(comments),
        [comments]
    );

    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            const postData = await fetchPostById(id);
            const commentsData = await fetchComments(id);
            setPost(postData);
            setComments(buildCommentTree(commentsData));
            if (postData && postData.content) {
                const wordsPerMinute = 225;
                const text = postData.content.replace(/<[^>]+>/g, '');
                const wordCount = text.split(/\s+/).length;
                const time = Math.ceil(wordCount / wordsPerMinute);
                setReadingTime(time);
            }
        } catch (err) {
            setError('Failed to load post.');
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    const handleCommentSubmit = async (content, parentId = null) => {
        if (!user) return toast.error("Please log in to comment.");
        const toastId = toast.loading('Submitting...');
        try {
            const res = await addComment({ postId: id, content, parentId }, token);
            setNewCommentId(res._id); // highlight new comment
            await fetchData();
            toast.success('Comment added!', { id: toastId });
            setActiveReplyId(null);
        } catch (err) {
            toast.error('Failed to add comment.', { id: toastId });
        }
    };

    // Edit comment handler
    const handleEditComment = async (commentId, newContent) => {
        try {
            // Assume you have an updateComment API (implement if not)
            await updateComment(commentId, { content: newContent }, token);
            toast.success('Comment updated!');
            await fetchData();
        } catch (err) {
            toast.error('Failed to update comment.');
        }
    };

    // Delete comment handler
    const handleDeleteComment = async (commentId) => {
        try {
            // Assume you have a deleteComment API (implement if not)
            await deleteComment(commentId, token);
            toast.success('Comment deleted!');
            await fetchData();
        } catch (err) {
            toast.error('Failed to delete comment.');
        }
    };

    // Like comment handler
    const handleLikeComment = async (commentId) => {
        if (!user) return toast.error('Please log in to like comments.');
        try {
            await likeComment(commentId, token);
            await fetchData();
        } catch (err) {
            toast.error('Failed to like comment.');
        }
    };
    // Dislike comment handler
    const handleDislikeComment = async (commentId) => {
        if (!user) return toast.error('Please log in to dislike comments.');
        try {
            await dislikeComment(commentId, token);
            await fetchData();
        } catch (err) {
            toast.error('Failed to dislike comment.');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deletePost(id, token);
                toast.success('Post deleted successfully');
                navigate('/');
            } catch (err) {
                toast.error('Failed to delete post.');
            }
        }
    };

    const handleLikeToggle = async () => {
        if (!user) return toast.error("Please log in to like a post.");
        try {
            const updatedPost = await toggleLike(id, token);
            setPost(updatedPost);
        } catch (err) {
            toast.error("Failed to update like status.");
        }
    };

    if (loading) return <PostPageSkeleton />;
    if (error) return <p className="error-message">{error}</p>;
    if (!post) return <p>Post not found.</p>;

    return (
        <>
            <motion.div
                className="progress-bar"
                style={{ scaleX: scrollYProgress }}
            />
            <div className="post-reader-shell">
                <article className="post-reader-card">
                    {user?._id === post.authorId?._id && (
                        <div className="post-actions">
                            <Link to={`/posts/${id}/edit`} className="post-action-btn">Edit</Link>
                            <button onClick={handleDelete} className="post-action-btn danger">Delete</button>
                        </div>
                    )}

                    <header className="post-header">
                        <h1 className="post-page-title">{post.title}</h1>
                        <div className="post-page-details">
                            <p className="post-page-meta">
                                By <Link to={`/profile/${post.authorId?.username}`}>{post.authorId?.username || 'Unknown'}</Link>
                                {' '}on {new Date(post.createdAt).toLocaleDateString()}
                                {readingTime > 0 && <span className="reading-time">· {readingTime} min read</span>}
                            </p>
                            <LikeButton post={post} onLikeToggle={handleLikeToggle} />
                        </div>
                    </header>

                    {post.media && post.media.length > 0 ? (
                        <section className="post-media-grid" aria-label="Post media gallery">
                            {post.media.map((item, index) => (
                                <div
                                    key={item.public_id || item.url || index}
                                    className={`post-media-cell ${index === 0 && post.media.length > 1 ? 'hero' : ''}`}
                                >
                                    <MediaRenderer item={item} postTitle={post.title} index={index} className="post-media-item" />
                                </div>
                            ))}
                        </section>
                    ) : post.coverImage ? (
                        <section className="post-cover-wrapper" aria-label="Post cover image">
                            <img src={post.coverImage} alt={post.title} className="post-cover-image" />
                        </section>
                    ) : (
                        <section className="post-no-media" aria-label="Text-only post">
                            Text-only story
                        </section>
                    )}

                    <div className="post-page-content" dangerouslySetInnerHTML={{ __html: post.content }} />

                    {post.tags && post.tags.length > 0 && (
                        <div className="post-tags-section">
                            {post.tags.map((tag) => (
                                <span key={tag} className="post-tag-badge">#{tag}</span>
                            ))}
                        </div>
                    )}
                </article>

                <section className="comments-section">
                    <div className="comments-header-row">
                        <h2 className="comments-title">
                            Comments <span className="comments-count">{commentCount}</span>
                        </h2>
                        <select
                            className="comments-sort-dropdown"
                            value={commentSort}
                            onChange={(e) => setCommentSort(e.target.value)}
                        >
                            <option value="recent">Most recent</option>
                            <option value="oldest">Oldest</option>
                        </select>
                    </div>

                    {user ? (
                        <CommentForm onSubmit={handleCommentSubmit} placeholder="Add comment..." buttonText="Submit" />
                    ) : (
                        <p className="login-prompt">Please <Link to="/login">log in</Link> to join the conversation.</p>
                    )}

                    <div className="comments-list">
                        {commentsForRender.length > 0 ? (
                            commentsForRender.map((comment) => (
                                <Comment
                                    key={comment._id}
                                    comment={comment}
                                    onReply={handleCommentSubmit}
                                    activeReplyId={activeReplyId}
                                    setActiveReplyId={setActiveReplyId}
                                    user={user}
                                    onEdit={handleEditComment}
                                    onDelete={handleDeleteComment}
                                    highlightNew={newCommentId === comment._id}
                                    onLike={handleLikeComment}
                                    onDislike={handleDislikeComment}
                                />
                            ))
                        ) : (
                            !loading && <p className="no-comments">No comments yet. Be the first to start the conversation.</p>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

export default PostPage; 
