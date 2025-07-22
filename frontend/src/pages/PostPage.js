import React, { useState, useEffect, useCallback } from 'react';
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
    const { scrollYProgress } = useScroll();

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

            {/* --- THIS IS THE FULL, CORRECTED STYLE BLOCK --- */}
            <style>{`
                /* --- Layout & Media --- */
                .post-split-layout { display: grid; grid-template-columns: 1fr 1fr; padding: 2rem 6rem; gap: 4rem; width: 100%; box-sizing: border-box; }
                .post-media-column { position: sticky; top: 2rem; align-self: start; max-height: 90vh; overflow-y: auto; }
                .post-content-column { min-width: 0; }
                @media (max-width: 1200px) { .post-split-layout { padding: 2rem 3rem; } }
                @media (max-width: 1024px) { .post-split-layout { grid-template-columns: 1fr; padding: 1.5rem; gap: 2rem; } .post-media-column { position: static; max-height: none; } }
                .media-gallery-container { display: flex; flex-wrap: wrap; gap: 1rem; }
                .media-wrapper { flex: 1 1 200px; height: auto; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; background-color: var(--card-border, #000); }
                .media-item { width: 100%; height: 100%; object-fit: cover; }
                .post-media-column > img, .post-media-column > video { width: 100%; border-radius: 12px; object-fit: cover; }
                .progress-bar { position: fixed; top: 0; left: 0; right: 0; height: 5px; background: var(--primary-color); transform-origin: 0%; z-index: 2000; }
                .reading-time { color: var(--secondary-text-color); font-size: 0.9rem; margin-left: 0.75rem; font-style: italic; }

                /* --- Post Content --- */
                .post-page-title { font-size: 1.8rem; margin-bottom: 0.5rem; line-height: 1.2; }
                .post-page-details { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid var(--card-border); padding-bottom: 1rem; }
                .post-page-meta a { color: var(--text-color); font-weight: 500; text-decoration: none; }
                .post-page-meta a:hover { text-decoration: underline; }
                .post-page-content { line-height: 1.7; font-size: 1rem; }
                .post-page-content * { max-width: 100%; }
                .post-tags-section { margin-top: 2rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .post-tag-badge { background-color: var(--tag-background); padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.9rem; }
                .post-actions { margin-bottom: 1.5rem; display: flex; gap: 1rem; }
                .btn { padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; display: inline-block; text-align: center; font-weight: 600; border: 1px solid transparent; background-color: var(--primary-color); color: var(--button-text-color); cursor: pointer; transition: background-color 0.2s; }
                .btn:hover:not(:disabled) { background-color: var(--primary-hover-color); }
                .btn:disabled { background-color: var(--secondary-text-color); cursor: not-allowed; opacity: 0.7; }
                .btn-danger { background-color: #dc3545; border-color: #dc3545; }

                /* --- RESTORED PROFESSIONAL COMMENT UI STYLES --- */
                .comments-section { margin-top: 4rem; border-top: 1px solid var(--card-border); padding-top: 2rem; }
                .comments-section h2 { font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; color: var(--text-color); }
                .comments-list { margin-top: 2.5rem; }
                .login-prompt { color: var(--secondary-text-color); }
                .login-prompt a { color: var(--primary-color); text-decoration: none; font-weight: 500; }
                .login-prompt a:hover { text-decoration: underline; }
                
                /* STYLES FOR THE COMMENT INPUT FORM */
                .comment-form { display: flex; flex-direction: column; gap: 1rem; }
                .comment-form .textarea-wrapper { position: relative; }
                .comment-form textarea {
                    width: 100%; min-height: 80px; padding: 0.75rem 3rem 0.75rem 1rem;
                    border-radius: 8px; border: 1px solid var(--card-border);
                    background-color: var(--background-color); color: var(--text-color);
                    font-size: 1rem; line-height: 1.5; resize: vertical;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .comment-form textarea:focus {
                    outline: none; border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px var(--primary-color-faded, rgba(99, 102, 241, 0.2));
                }
                .comment-form .emoji-toggle-btn {
                    position: absolute; right: 10px; top: 12px; background: none; border: none;
                    cursor: pointer; color: var(--secondary-text-color); font-size: 1.3rem; padding: 0.25rem;
                }
                .comment-form .emoji-picker-container { position: relative; z-index: 10; }
                .comment-form .form-actions { display: flex; justify-content: flex-end; }
                .modern-comments-section {
                    max-width: 700px;
                    margin: 3rem auto 0 auto;
                    background: var(--card-background);
                    border-radius: 16px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                    padding: 2.5rem 2rem;
                }
                .modern-comments-list {
                    width: 100%;
                }
                .dribbble-comments-card {
                    background: var(--card-background);
                    border-radius: 18px;
                    box-shadow: 0 4px 32px rgba(0,0,0,0.10);
                    padding: 2.5rem 2rem 2rem 2rem;
                    max-width: 700px;
                    margin: 3rem auto 0 auto;
                    border: 1px solid var(--card-border);
                }
                .comments-header-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                }
                .comments-title {
                    font-size: 1.35rem;
                    font-weight: 700;
                    margin: 0;
                    color: var(--text-color);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .comments-count {
                    background: var(--primary-color);
                    color: var(--button-text-color);
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 12px;
                    padding: 0.1rem 0.7rem;
                    margin-left: 0.5rem;
                }
                .comments-sort-dropdown {
                    border: 1px solid var(--card-border);
                    border-radius: 8px;
                    padding: 0.4rem 1.2rem 0.4rem 0.7rem;
                    font-size: 1rem;
                    background: var(--tag-background);
                    color: var(--text-color);
                    font-weight: 500;
                    outline: none;
                    cursor: pointer;
                }
                .comments-divider {
                    border: none;
                    border-top: 1.5px solid var(--card-border);
                    margin: 2.5rem 0 1.5rem 0;
                    width: 100%;
                }
                .dribbble-comments-card.centered-comments {
                    max-width: 900px;
                    margin: 0 auto 2.5rem auto;
                    border-radius: 18px;
                    box-shadow: 0 4px 32px rgba(0,0,0,0.10);
                    background: var(--card-background);
                    border: 1px solid var(--card-border);
                    padding: 2.5rem 2rem 2rem 2rem;
                }
            `}</style>

            <div className="post-split-layout">
                <div className="post-media-column">
                    {post.media && post.media.length > 0 ? (
                        <div className="media-gallery-container">
                            {post.media.map((item, index) => (
                                <div key={item.public_id || index} className="media-wrapper">
                                    <MediaRenderer item={item} postTitle={post.title} index={index} />
                                </div>
                            ))}
                        </div>
                    ) : (post.coverImage && (
                        <img src={post.coverImage} alt={post.title} />
                    ))}
                </div>

                <div className="post-content-column">
                    {user?._id === post.authorId?._id && (
                        <div className="post-actions">
                            <Link to={`/posts/${id}/edit`} className="btn">Edit</Link>
                            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
                        </div>
                    )}
                    <h1 className="post-page-title">{post.title}</h1>
                    <div className="post-page-details">
                        <p className="post-page-meta">
                            By <Link to={`/profile/${post.authorId?.username}`}>{post.authorId?.username || 'Unknown'}</Link> on {new Date(post.createdAt).toLocaleDateString()}
                            {readingTime > 0 && <span className="reading-time">· {readingTime} min read</span>}
                        </p>
                        <LikeButton post={post} onLikeToggle={handleLikeToggle} />
                    </div>
                    <div className="post-page-content" dangerouslySetInnerHTML={{ __html: post.content }} />
                    {post.tags && post.tags.length > 0 && (
                        <div className="post-tags-section">
                            {post.tags.map(tag => (<span key={tag} className="post-tag-badge">{tag}</span>))}
                        </div>
                    )}
                </div>
            </div>
            {/* <hr className="comments-divider" /> */}
            <div className="comments-section dribbble-comments-card centered-comments" style={{ maxWidth: 1272, width: '100%', margin: '3rem auto 0 auto', background: 'var(--card-background, #fff)', borderRadius: 18, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1.5px solid var(--border-color, #ececec)', padding: '2.5rem 2rem 2rem 2rem', position: 'relative' }}>
                <div className="comments-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 className="comments-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Comments <span className="comments-count" style={{ background: 'var(--primary-color)', color: 'var(--button-text-color)', fontSize: '1rem', fontWeight: 600, borderRadius: 12, padding: '0.1rem 0.7rem', marginLeft: '0.5rem' }}>{comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)}</span></h2>
                    <select className="comments-sort-dropdown" defaultValue="recent" style={{ border: '1px solid var(--card-border)', borderRadius: 8, padding: '0.4rem 1.2rem 0.4rem 0.7rem', fontSize: '1rem', background: 'var(--tag-background)', color: 'var(--text-color)', fontWeight: 500, outline: 'none', cursor: 'pointer' }}>
                        <option value="recent">Most recent</option>
                        <option value="oldest">Oldest</option>
                    </select>
                </div>
                {user ? (
                    <div style={{ maxWidth: '100%' }}>
                        <CommentForm onSubmit={handleCommentSubmit} placeholder="Add comment..." buttonText="Submit" dribbbleStyle />
                    </div>
                ) : (
                    <p className="login-prompt" style={{ maxWidth: '100%' }}>Please <Link to="/login">log in</Link> to join the conversation.</p>
                )}
                <div className="comments-list modern-comments-list" style={{ maxWidth: '100%' }}>
                    {comments.length > 0 ? (
                        comments.map((comment) => (
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
                                dribbbleStyle
                                onLike={handleLikeComment}
                                onDislike={handleDislikeComment}
                            />
                        ))
                    ) : (
                        !loading && <p>No comments yet. Be the first to start the conversation!</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default PostPage; 
